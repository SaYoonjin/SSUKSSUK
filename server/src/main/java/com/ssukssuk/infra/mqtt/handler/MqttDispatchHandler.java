package com.ssukssuk.infra.mqtt.handler;

import com.ssukssuk.infra.mqtt.dto.MqttEnvelope;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class MqttDispatchHandler {

    private final Map<String, MqttMessageHandler> handlers;

    public void dispatch(MqttEnvelope envelope) {
        if (envelope == null) return;

        String topic = envelope.getTopicRaw();
        String channel = envelope.getChannel();

        if (channel != null) {
            MqttMessageHandler handler = handlers.get(channel);
            if (handler != null) {
                handler.handle(envelope);
                return;
            }
            log.warn("[MQTT][DISPATCH] no handler for channel={}, available={}", channel, handlers.keySet());
        }

        String fallbackKey = resolveHandlerKeyByTopic(topic);
        if (fallbackKey == null) {
            log.warn("[MQTT][DISPATCH] unknown topic. topic={}", topic);
            return;
        }

        MqttMessageHandler fallbackHandler = handlers.get(fallbackKey);
        if (fallbackHandler == null) {
            log.warn("[MQTT][DISPATCH] fallback handler not found. key={}, available={}", fallbackKey, handlers.keySet());
            return;
        }

        fallbackHandler.handle(envelope);
    }

    private String resolveHandlerKeyByTopic(String topic) {
        if (topic == null) return null;

        if (topic.contains("/telemetry/sensors")) return "sensors";

        if (topic.contains("/telemetry/action-result")) return "actionResult";

        if (topic.contains("/telemetry/ack")) return "ack";

        return null;
    }
}