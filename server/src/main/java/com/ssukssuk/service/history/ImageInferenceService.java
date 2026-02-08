package com.ssukssuk.service.history;

import com.ssukssuk.domain.history.ImageInference;
import com.ssukssuk.domain.history.PlantImage;
import com.ssukssuk.domain.plant.UserPlant;
import com.ssukssuk.dto.history.DeviceImageInferenceRequest;
import com.ssukssuk.dto.history.PlantHistoryResponse;
import com.ssukssuk.infra.idempotency.IdempotencyService;
import com.ssukssuk.repository.history.DailyHeightRow;
import com.ssukssuk.repository.history.ImageInferenceRepository;
import com.ssukssuk.repository.history.PlantImageRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import com.ssukssuk.service.notification.NotificationService;
import com.ssukssuk.service.plant.PlantStatusService;
import com.ssukssuk.service.push.PushService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImageInferenceService {

    private final PlantImageRepository plantImageRepository;
    private final ImageInferenceRepository imageInferenceRepository;
    private final UserPlantRepository userPlantRepository;
    private final IdempotencyService idempotencyService;
    private final NotificationService notificationService;
    private final PlantStatusService plantStatusService;
    private final PushService pushService;

    private static final int FIXED_PERIOD_DAYS = 14;
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    // 디바이스 AI 추론 픽셀 값 → 실제 cm 변환 스케일 (기준: 865px=15cm, 344px=10cm)
    private static final double HEIGHT_SCALE = 15.0 / 865.0;
    private static final double WIDTH_SCALE = 10.0 / 344.0;

    @Transactional
    public void handle(DeviceImageInferenceRequest request) {

        // 1. 기본 검증
        if (request == null
                || isBlank(request.getMsgId())
                || isBlank(request.getSerialNum())
                || isBlank(request.getType())) {
            return;
        }

        // 2. 멱등 처리
        String idempotencyKey = request.getSerialNum() + ":" + request.getMsgId();
        if (!idempotencyService.markIfFirst(idempotencyKey)) {
            return;
        }

        // 3. plant 검증
        if (request.getPlantId() == null) {
            return;
        }

        boolean bound = userPlantRepository.existsActiveBinding(
                request.getPlantId(),
                request.getSerialNum()
        );
        if (!bound) return;

        UserPlant plant = userPlantRepository.findById(request.getPlantId())
                .orElse(null);
        if (plant == null) return;

        // 4. 이미지 유효성: kind + url 필수, measuredAt 없으면 now로 보정
        boolean hasTop = hasImage(request.getImageKind1(), request.getPublicUrl1());
        boolean hasSide = hasImage(request.getImageKind2(), request.getPublicUrl2());

        if (!hasTop && !hasSide) return;

        // 5. inference 필수값: confidence 필수 + (anomaly/height/width 중 최소 1개)
        if (request.getConfidence() == null) {
            return;
        }
        boolean hasAtLeastOne = request.getAnomaly() != null
                || request.getHeight() != null
                || request.getWidth() != null;
        if (!hasAtLeastOne) {
            return;
        }

        // 6. measuredAt 보정
        OffsetDateTime now = OffsetDateTime.now();

        OffsetDateTime measuredAt1 = hasTop
                ? (request.getMeasuredAt1() != null
                ? request.getMeasuredAt1()
                : now)
                : null;

        OffsetDateTime measuredAt2 = hasSide
                ? (request.getMeasuredAt2() != null
                ? request.getMeasuredAt2()
                : now)
                : null;

        // 7. PlantImage 저장
        PlantImage image = PlantImage.builder()
                .plant(plant)
                .imageUrlTop(hasTop ? request.getPublicUrl1() : null)
                .imageUrlSide(hasSide ? request.getPublicUrl2() : null)
                .capturedAt(hasTop ? measuredAt1 : measuredAt2)
                .build();

        plantImageRepository.save(image);

        // 8. 높이/넓이 픽셀→cm 보정
        Double correctedHeight = request.getHeight() != null
                ? Math.round(request.getHeight() * HEIGHT_SCALE * 10.0) / 10.0
                : null;
        Double correctedWidth = request.getWidth() != null
                ? Math.round(request.getWidth() * WIDTH_SCALE * 10.0) / 10.0
                : null;

        // 9. ImageInference 저장
        ImageInference inference = ImageInference.builder()
                .plant(plant)
                .image(image)
                .height(correctedHeight)
                .width(correctedWidth)
                .anomaly(request.getAnomaly())
                .confidence(request.getConfidence())
                .symptomEnum(request.getSymptomEnum())
                .inferenceAt(hasTop ? measuredAt1 : measuredAt2)
                .build();

        imageInferenceRepository.save(inference);

        // 10. PlantStatus 업데이트 (이미지 데이터 반영)
        Integer anomalyValue = request.getAnomaly();
        plantStatusService.updateFromImage(
                request.getPlantId(),
                correctedHeight,
                correctedWidth,
                anomalyValue
        );

        // 11. 이상 감지 시 알람: confidence >= 70 && anomaly >= 3
        if (request.getConfidence() >= 70
                && request.getAnomaly() != null
                && request.getAnomaly() >= 5) {
            Long notificationId =
                notificationService.notifyImageDiscolorationAndReturnId(plant, inference);

            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            pushService.sendNotification(notificationId);
                        }
                    }
            );

            // 안읽은 알림 표시
            plantStatusService.markUnreadNotification(request.getPlantId());
        }
    }

    @Transactional(readOnly = true)
    public PlantHistoryResponse.GrowthGraph getGrowthGraph14Days(Long plantId) {

        LocalDate end = LocalDate.now(KST);
        LocalDate start = end.minusDays(FIXED_PERIOD_DAYS - 1);

        LocalDateTime startDt = start.atStartOfDay();
        LocalDateTime endExclusive = end.plusDays(1).atStartOfDay();

        List<DailyHeightRow> rows =
                imageInferenceRepository.findDailyLastHeight(plantId, startDt, endExclusive);

        Map<LocalDate, DailyHeightRow> map = rows.stream()
                .collect(Collectors.toMap(
                        DailyHeightRow::getD,
                        row -> row
                ));

        List<PlantHistoryResponse.GrowthPoint> data = new ArrayList<>(FIXED_PERIOD_DAYS);
        for (int i = 0; i < FIXED_PERIOD_DAYS; i++) {
            LocalDate d = start.plusDays(i);
            DailyHeightRow row = map.get(d);
            data.add(PlantHistoryResponse.GrowthPoint.builder()
                    .date(d.toString())
                    .height(row != null ? row.getHeight() : null)
                    .width(row != null ? row.getWidth() : null)
                    .build());
        }

        return PlantHistoryResponse.GrowthGraph.builder()
                .unit("cm")
                .period(PlantHistoryResponse.Period.builder()
                        .start(start.toString())
                        .end(end.toString())
                        .build())
                .data(data)
                .build();
    }

    private boolean hasImage(String kind, String url) {
        return !isBlank(kind) && !isBlank(url);
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
