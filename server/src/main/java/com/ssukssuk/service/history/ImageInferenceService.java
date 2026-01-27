package com.ssukssuk.service.history;

import com.ssukssuk.common.mqtt.dto.AckMessage;
import com.ssukssuk.common.mqtt.idempotency.MqttIdempotencyManager;
import com.ssukssuk.common.mqtt.service.MqttPublishService;
import com.ssukssuk.domain.history.ImageInference;
import com.ssukssuk.domain.history.PlantImage;
import com.ssukssuk.dto.history.DeviceImageInferenceRequest;
import com.ssukssuk.repository.history.ImageInferenceRepository;
import com.ssukssuk.repository.history.PlantImageRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import com.ssukssuk.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImageInferenceService {

    private final PlantImageRepository plantImageRepository;
    private final ImageInferenceRepository imageInferenceRepository;
    private final UserPlantRepository userPlantRepository;
    private final NotificationService notificationService;

    private final MqttIdempotencyManager idempotencyManager;
    private final MqttPublishService mqttPublishService;

    private static final String REF_TYPE = "IMAGE_INFERENCE";

    // 변색률(%) 기준
    private static final double DISCOLOR_RATIO_THRESHOLD = 20.0;
    // 신뢰도(%) 기준
    private static final double CONFIDENCE_THRESHOLD = 70.0;

    @Transactional
    public void handle(DeviceImageInferenceRequest request) {

        if (request == null
                || isBlank(request.getMsgId())
                || isBlank(request.getSerialNum())
                || isBlank(request.getType())) {

            safeAckError(
                    request,
                    AckMessage.AckErrorCode.INVALID_PAYLOAD,
                    "missing required fields: msg_id/serial_num/type"
            );
            return;
        }

        if (!idempotencyManager.firstSeen(request.getMsgId())) {
            mqttPublishService.sendAck(
                    AckMessage.droppedDuplicate(
                            request.getSerialNum(),
                            request.getPlantId(),
                            request.getMsgId(),
                            REF_TYPE,
                            UUID.randomUUID().toString()
                    )
            );
            return;
        }

        if (request.getPlantId() == null) {
            mqttPublishService.sendAck(
                    AckMessage.error(
                            request.getSerialNum(),
                            null,
                            request.getMsgId(),
                            REF_TYPE,
                            UUID.randomUUID().toString(),
                            AckMessage.AckErrorCode.PLANT_NOT_BOUND,
                            "plant_id is null"
                    )
            );
            return;
        }

        boolean bound = userPlantRepository.existsActiveBinding(
                request.getPlantId(),
                request.getSerialNum()
        );

        if (!bound) {
            mqttPublishService.sendAck(
                    AckMessage.error(
                            request.getSerialNum(),
                            request.getPlantId(),
                            request.getMsgId(),
                            REF_TYPE,
                            UUID.randomUUID().toString(),
                            AckMessage.AckErrorCode.PLANT_DEVICE_MISMATCH,
                            "Device-Plant binding mismatch"
                    )
            );
            return;
        }

        boolean has1 = hasImage(request.getImageKind1(), request.getPublicUrl1(), request.getMeasuredAt1());
        boolean has2 = hasImage(request.getImageKind2(), request.getPublicUrl2(), request.getMeasuredAt2());

        if (!has1 && !has2) {
            mqttPublishService.sendAck(
                    AckMessage.error(
                            request.getSerialNum(),
                            request.getPlantId(),
                            request.getMsgId(),
                            REF_TYPE,
                            UUID.randomUUID().toString(),
                            AckMessage.AckErrorCode.INVALID_PAYLOAD,
                            "no valid image payload (need kind+url+measured_at)"
                    )
            );
            return;
        }

        if (request.getHeight() == null || request.getWidth() == null
                || request.getAnomaly() == null || request.getConfidence() == null) {
            mqttPublishService.sendAck(
                    AckMessage.error(
                            request.getSerialNum(),
                            request.getPlantId(),
                            request.getMsgId(),
                            REF_TYPE,
                            UUID.randomUUID().toString(),
                            AckMessage.AckErrorCode.INVALID_PAYLOAD,
                            "missing inference fields (height/width/anomaly/confidence)"
                    )
            );
            return;
        }

        if (has1) {
            PlantImage img1 = saveImage(
                    request.getPlantId(),
                    request.getImageKind1(),
                    request.getPublicUrl1(),
                    request.getMeasuredAt1()
            );
            saveInferenceAndMaybeNotify(img1, request);
        }

        if (has2) {
            PlantImage img2 = saveImage(
                    request.getPlantId(),
                    request.getImageKind2(),
                    request.getPublicUrl2(),
                    request.getMeasuredAt2()
            );
            saveInferenceAndMaybeNotify(img2, request);
        }

        mqttPublishService.sendAck(
                AckMessage.ok(
                        request.getSerialNum(),
                        request.getPlantId(),
                        request.getMsgId(),
                        REF_TYPE,
                        UUID.randomUUID().toString()
                )
        );
    }

    private boolean hasImage(String kind, String url, LocalDateTime measuredAt) {
        return !isBlank(kind) && !isBlank(url) && measuredAt != null;
    }

    private PlantImage saveImage(Long plantId, String cameraPosition, String imageUrl, LocalDateTime capturedAt) {
        PlantImage image = PlantImage.builder()
                .plantId(plantId)
                .cameraPosition(normalizeCameraPosition(cameraPosition))
                .imageUrl(imageUrl)
                .capturedAt(capturedAt)
                .build();

        return plantImageRepository.save(image);
    }

    // inference 저장 후 조건 충족 시 notification 생성
    private void saveInferenceAndMaybeNotify(PlantImage image, DeviceImageInferenceRequest req) {
        ImageInference inference = ImageInference.builder()
                .plantImage(image)
                .height(req.getHeight())
                .width(req.getWidth())
                .anomaly(req.getAnomaly())          // 변색률(%)
                .confidence(req.getConfidence())    // 신뢰도(%)
                .inferenceAt(LocalDateTime.now())
                .build();

        imageInferenceRepository.save(inference);

        // ID 확보
        Long inferenceId = inference.getInferenceId();

        // 변색 이상치 조건: anomaly >= 20% AND confidence >= 70%
        if (isDiscolorAnomaly(req.getAnomaly(), req.getConfidence())) {

            notificationService.notifyImageDiscoloration(
                    req.getPlantId(),
                    inferenceId
            );
        }
    }

    private boolean isDiscolorAnomaly(Double anomalyPercent, Double confidencePercent) {
        if (anomalyPercent == null || confidencePercent == null) return false;
        return anomalyPercent >= DISCOLOR_RATIO_THRESHOLD
                && confidencePercent >= CONFIDENCE_THRESHOLD;
    }

    private String normalizeCameraPosition(String value) {
        if (isBlank(value)) throw new IllegalArgumentException("cameraPosition is null/blank");
        String v = value.trim().toUpperCase();
        if (!v.equals("TOP") && !v.equals("SIDE")) {
            throw new IllegalArgumentException("Invalid cameraPosition: " + value);
        }
        return v;
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private void safeAckError(DeviceImageInferenceRequest request,
                              AckMessage.AckErrorCode code,
                              String msg) {

        if (request == null || isBlank(request.getSerialNum())) return;

        String refMsgId = isBlank(request.getMsgId()) ? "UNKNOWN" : request.getMsgId();

        mqttPublishService.sendAck(
                AckMessage.error(
                        request.getSerialNum(),
                        request.getPlantId(),
                        refMsgId,
                        REF_TYPE,
                        UUID.randomUUID().toString(),
                        code,
                        msg
                )
        );
    }
}