package com.ssukssuk.service.history;

import com.ssukssuk.domain.history.ImageInference;
import com.ssukssuk.domain.history.PlantImage;
import com.ssukssuk.domain.plant.UserPlant;
import com.ssukssuk.dto.history.DeviceImageInferenceRequest;
import com.ssukssuk.infra.idempotency.IdempotencyService;
import com.ssukssuk.repository.history.ImageInferenceRepository;
import com.ssukssuk.repository.history.PlantImageRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import com.ssukssuk.service.notification.NotificationService;
import com.ssukssuk.service.plant.PlantStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ImageInferenceService {

    private final PlantImageRepository plantImageRepository;
    private final ImageInferenceRepository imageInferenceRepository;
    private final UserPlantRepository userPlantRepository;
    private final IdempotencyService idempotencyService;
    private final NotificationService notificationService;
    private final PlantStatusService plantStatusService;

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
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime measuredAt1 = hasTop
                ? (request.getMeasuredAt1() != null ? request.getMeasuredAt1() : now)
                : null;
        LocalDateTime measuredAt2 = hasSide
                ? (request.getMeasuredAt2() != null ? request.getMeasuredAt2() : now)
                : null;

        // 7. PlantImage 저장
        PlantImage image = PlantImage.builder()
                .plant(plant)
                .imageUrlTop(hasTop ? request.getPublicUrl1() : null)
                .imageUrlSide(hasSide ? request.getPublicUrl2() : null)
                .capturedAt(hasTop ? measuredAt1 : measuredAt2)
                .build();

        plantImageRepository.save(image);

        // 8. ImageInference 저장
        ImageInference inference = ImageInference.builder()
                .plant(plant)
                .image(image)
                .height(request.getHeight())
                .width(request.getWidth())
                .anomaly(request.getAnomaly() != null ? request.getAnomaly().intValue() : null)
                .confidence(request.getConfidence())
                .symptomEnum(request.getSymptomEnum())
                .inferenceAt(now)
                .build();

        imageInferenceRepository.save(inference);

        // 9. PlantStatus 업데이트 (이미지 데이터 반영)
        Integer anomalyValue = request.getAnomaly() != null ? request.getAnomaly().intValue() : null;
        plantStatusService.updateFromImage(
                request.getPlantId(),
                request.getHeight(),
                request.getWidth(),
                anomalyValue
        );

        // 10. 이상 감지 시 알람: confidence >= 70 && anomaly >= 3
        if (request.getConfidence() >= 70
                && request.getAnomaly() != null
                && request.getAnomaly() >= 3) {
            notificationService.notifyImageDiscoloration(plant, inference);

            // 안읽은 알림 표시
            plantStatusService.markUnreadNotification(request.getPlantId());
        }
    }

    private boolean hasImage(String kind, String url) {
        return !isBlank(kind) && !isBlank(url);
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
