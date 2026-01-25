package com.ssukssuk.infra.mqtt;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.integration.mqtt.outbound.MqttPahoMessageHandler;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MqttPublisher {

    private final MqttPahoMessageHandler mqttOutbound;
    private final ObjectMapper objectMapper;

    public void publish(String topic, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);

            mqttOutbound.handleMessage(
                    MessageBuilder.withPayload(json)
                            .setHeader(MqttHeaders.TOPIC, topic)
                            .setHeader(MqttHeaders.QOS, 1)   // ACK는 QoS1 권장
                            .build()
            );

            log.info("[MQTT][PUB] topic={}, payload={}", topic, json);

        } catch (Exception e) {
            log.error("[MQTT][PUB] FAILED topic={}, payload={}", topic, payload, e);
            throw new RuntimeException("MQTT publish failed: " + topic, e);
        }
    }

    public static String controlTopic(String serialNum, String channel) {
        return "devices/" + serialNum + "/control/" + channel;
    }

    public static String ackTopic(String serialNum) {
        return "devices/" + serialNum + "/control/ack";
    }
}
