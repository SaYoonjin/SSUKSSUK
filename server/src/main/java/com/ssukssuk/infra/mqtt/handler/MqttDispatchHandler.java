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
        MqttMessageHandler handler = handlers.get(envelope.getChannel());
        if (handler == null) {
            return;
        }
        handler.handle(envelope);
    }
}