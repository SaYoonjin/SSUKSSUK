package com.ssukssuk.infra.mqtt;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.integration.mqtt.outbound.MqttPahoMessageHandler;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Component;

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
                            .build()
            );
        } catch (Exception ignored) {
        }
    }

    public static String controlTopic(String serialNum, String channel) {
        return "devices/" + serialNum + "/control/" + channel;
    }

    public static String ackTopic(String serialNum) {
        return "devices/" + serialNum + "/control/ack";
    }
}