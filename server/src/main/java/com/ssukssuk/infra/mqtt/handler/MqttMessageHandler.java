package com.ssukssuk.infra.mqtt.handler;

import com.ssukssuk.infra.mqtt.dto.MqttEnvelope;

public interface MqttMessageHandler {
    void handle(MqttEnvelope envelope);
}