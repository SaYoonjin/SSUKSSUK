package com.ssukssuk.infra.mqtt.handler;

import com.ssukssuk.common.mqtt.dto.MqttEnvelope;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class MqttDispatchHandler {

    private final Map<String, MqttMessageHandler> handlers;

    public void dispatch(MqttEnvelope envelope) {
        if (envelope == null || envelope.getChannel() == null) return;

        MqttMessageHandler handler = handlers.get(envelope.getChannel());
        if (handler == null) {
            // 매칭되는 handler 없으면 그냥 무시
            return;
        }
        handler.handle(envelope);
    }
}
