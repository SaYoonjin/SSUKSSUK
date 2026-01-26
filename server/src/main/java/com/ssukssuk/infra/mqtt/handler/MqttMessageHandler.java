package com.ssukssuk.infra.mqtt.handler;

import com.ssukssuk.common.mqtt.dto.MqttEnvelope;

public interface MqttMessageHandler {
    void handle(MqttEnvelope envelope);
}