package com.ssukssuk.infra.mqtt.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssukssuk.common.mqtt.dto.AckMessage;
import com.ssukssuk.common.mqtt.dto.MqttEnvelope;
import com.ssukssuk.common.mqtt.idempotency.MqttIdempotencyManager;
import com.ssukssuk.common.mqtt.service.MqttPublishService;
import com.ssukssuk.dto.history.DeviceImageUploadedRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component("image-uploaded")
@RequiredArgsConstructor
public class ImageUploadedHandler implements MqttMessageHandler {

    private final ObjectMapper objectMapper;
    private final MqttIdempotencyManager idempotencyManager;
    private final MqttPublishService mqttPublishService;

    @Override
    public void handle(MqttEnvelope envelope) {
        try {
            DeviceImageUploadedRequest req =
                    objectMapper.treeToValue(envelope.getPayloadJson(), DeviceImageUploadedRequest.class);

            // 멱등
            if (!idempotencyManager.firstSeen(req.getMsgId())) {
                mqttPublishService.sendAck(
                        AckMessage.droppedDuplicate(
                                req.getSerialNum(),
                                req.getPlantId(),
                                req.getMsgId(),
                                "IMAGE_UPLOADED",
                                UUID.randomUUID().toString()
                        )
                );
                return;
            }

            log.info("[IMAGE_UPLOADED] serial={}, plant={}, kind={}, url={}",
                    req.getSerialNum(),
                    req.getPlantId(),
                    req.getImageKind(),
                    req.getUploadUrl()
            );

            mqttPublishService.sendAck(
                    AckMessage.ok(
                            req.getSerialNum(),
                            req.getPlantId(),
                            req.getMsgId(),
                            "IMAGE_UPLOADED",
                            UUID.randomUUID().toString()
                    )
            );

        } catch (Exception e) {
            log.error("[IMAGE_UPLOADED] 처리 실패", e);
        }
    }
}
