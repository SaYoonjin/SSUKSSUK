package com.ssukssuk.common.mqtt.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssukssuk.common.mqtt.MqttGateway;
import com.ssukssuk.common.mqtt.Topic;
import com.ssukssuk.common.mqtt.dto.AckMessage;
import com.ssukssuk.common.mqtt.dto.UploadUrlCommand;
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

    public void sendUploadUrlCommand(
            String serial,
            Long plantId,
            String msgId,
            String uploadUrl
    ) {
        try {
            UploadUrlCommand cmd = UploadUrlCommand.builder()
                    .msg_id(msgId)
                    .type("CAPTURE_AND_INFER")
                    .plant_id(plantId)
                    .upload_url(uploadUrl)
                    .build();

            String payload = objectMapper.writeValueAsString(cmd);
            String topic = String.format(Topic.CONTROL_UPLOAD_URL, serial);

            mqttGateway.publish(payload, topic, 1, false);

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

}
