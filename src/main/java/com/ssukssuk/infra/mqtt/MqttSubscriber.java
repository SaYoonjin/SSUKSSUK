package com.ssukssuk.infra.mqtt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssukssuk.infra.mqtt.dto.MqttEnvelope;
import com.ssukssuk.infra.mqtt.handler.MqttDispatchHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MqttSubscriber {

    private final ObjectMapper objectMapper;
    private final MqttDispatchHandler dispatchHandler;

    @ServiceActivator(inputChannel = "mqttInboundChannel")
    public void onMessage(Message<?> message) {
        String topic = String.valueOf(message.getHeaders().get("mqtt_receivedTopic"));
        String payload = String.valueOf(message.getPayload());

        log.info("[MQTT][SUB] topic={}, payload={}", topic, payload);

        try {
            MqttEnvelope envelope = MqttEnvelope.from(topic, payload, objectMapper);

            dispatchHandler.dispatch(envelope);

        } catch (Exception e) {
            log.error("[MQTT] inbound 처리 실패. topic={}, payload={}", topic, payload, e);
        }
    }
}