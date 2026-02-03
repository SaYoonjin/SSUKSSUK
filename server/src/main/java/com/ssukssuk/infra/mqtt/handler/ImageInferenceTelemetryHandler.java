package com.ssukssuk.infra.mqtt.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssukssuk.infra.mqtt.dto.MqttEnvelope;
import com.ssukssuk.dto.history.DeviceImageInferenceRequest;
import com.ssukssuk.service.history.ImageInferenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component("image-inference") // channel 과 반드시 동일
@RequiredArgsConstructor
public class ImageInferenceTelemetryHandler implements MqttMessageHandler {

    private final ObjectMapper objectMapper;
    private final ImageInferenceService imageInferenceService;

    @Override
    public void handle(MqttEnvelope envelope) {
        try {
            DeviceImageInferenceRequest req =
                    objectMapper.treeToValue(
                            envelope.getPayloadJson(),
                            DeviceImageInferenceRequest.class
                    );  

            imageInferenceService.handle(req);

        } catch (Exception e) {
            log.error(
                    "[MQTT][IMAGE_INFERENCE] payload parse/handle 실패. serial={}, payload={}",
                    envelope.getSerialNum(),
                    envelope.getPayloadJson(),
                    e
            );
        }
    }
}
