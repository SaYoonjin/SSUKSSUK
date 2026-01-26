package com.ssukssuk.common.mqtt.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssukssuk.common.mqtt.MqttGateway;
import com.ssukssuk.common.mqtt.dto.AckMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MqttPublishService {

    private final ObjectMapper objectMapper;
    private final MqttGateway mqttGateway;

    public void sendAck(AckMessage ack) {
        try {
            String payload = objectMapper.writeValueAsString(ack);
            String topic = "devices/" + ack.getSerial_num() + "/control/ack";
            mqttGateway.publish(payload, topic, 1, false);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}
