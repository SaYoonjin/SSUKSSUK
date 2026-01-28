package com.ssukssuk.service.history;

import com.ssukssuk.domain.history.ImageInference;
import com.ssukssuk.domain.history.PlantImage;
import com.ssukssuk.dto.history.DeviceImageInferenceRequest;
import com.ssukssuk.infra.idempotency.IdempotencyService;
import com.ssukssuk.repository.history.ImageInferenceRepository;
import com.ssukssuk.repository.history.PlantImageRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
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

        // 4. 이미지 유효성
        boolean hasTop = hasImage(
                request.getImageKind1(),
                request.getPublicUrl1(),
                request.getMeasuredAt1()
        );

        boolean hasSide = hasImage(
                request.getImageKind2(),
                request.getPublicUrl2(),
                request.getMeasuredAt2()
        );

        if (!hasTop && !hasSide) return;

        // 5. inference 필수값
        if (request.getHeight() == null
                || request.getWidth() == null
                || request.getAnomaly() == null
                || request.getConfidence() == null) {
            return;
        }

        // 6. PlantImage 저장 (한 번만)
        PlantImage image = PlantImage.builder()
                .plantId(request.getPlantId())
                .imageUrlTop(hasTop ? request.getPublicUrl1() : null)
                .imageUrlSide(hasSide ? request.getPublicUrl2() : null)
                .capturedAt(
                        hasTop ? request.getMeasuredAt1()
                                : request.getMeasuredAt2()
                )
                .build();

        plantImageRepository.save(image);

        // 7. ImageInference 저장
        ImageInference inference = ImageInference.builder()
                .plantId(request.getPlantId())
                .imageId(image.getImageId())
                .height(request.getHeight())
                .width(request.getWidth())
                .anomaly(request.getAnomaly().intValue())
                .confidence(request.getConfidence())
                .symptomEnum(request.getSymptomEnum()) // DTO에 존재해야 함
                .inferenceAt(LocalDateTime.now())
                .build();

        imageInferenceRepository.save(inference);
    }

    private boolean hasImage(String kind, String url, LocalDateTime measuredAt) {
        return !isBlank(kind) && !isBlank(url) && measuredAt != null;
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
