package com.ssukssuk.infra.mqtt.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssukssuk.common.mqtt.dto.AckMessage;
import com.ssukssuk.common.mqtt.dto.MqttEnvelope;
import com.ssukssuk.common.mqtt.dto.SensorUplinkMessage;
import com.ssukssuk.infra.idempotency.IdempotencyService;
import com.ssukssuk.infra.mqtt.MqttPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component("sensors")
@RequiredArgsConstructor
public class SensorTelemetryHandler implements MqttMessageHandler {

    private final ObjectMapper objectMapper;
    private final IdempotencyService idempotencyService;
    private final MqttPublisher mqttPublisher;

    @Override
    public void handle(MqttEnvelope envelope) {
        if (envelope.getDirection() != MqttEnvelope.Direction.TELEMETRY) return;

        SensorUplinkMessage msg;
        try {
            msg = objectMapper.treeToValue(envelope.getPayloadJson(), SensorUplinkMessage.class);
        } catch (Exception e) {
            return;
        }

        String ackTopic = MqttPublisher.ackTopic(envelope.getSerialNum());
        String ackMsgId = UUID.randomUUID().toString();

        if (msg.getPlant_id() == null) {
            mqttPublisher.publish(ackTopic,
                    AckMessage.error(envelope.getSerialNum(), null, msg.getMsg_id(), "SENSOR_UPLINK",
                            ackMsgId, AckMessage.AckErrorCode.PLANT_NOT_BOUND, "plant_id is null"));
            return;
        }

        String key = envelope.getSerialNum() + ":" + msg.getMsg_id();
        boolean first = idempotencyService.markIfFirst(key);
        if (!first) {
            mqttPublisher.publish(ackTopic,
                    AckMessage.droppedDuplicate(envelope.getSerialNum(), msg.getPlant_id(), msg.getMsg_id(),
                            "SENSOR_UPLINK", ackMsgId));
            return;
        }

        try {
            mqttPublisher.publish(ackTopic,
                    AckMessage.ok(envelope.getSerialNum(), msg.getPlant_id(), msg.getMsg_id(),
                            "SENSOR_UPLINK", ackMsgId));

        } catch (IllegalStateException bindingMismatch) {
            mqttPublisher.publish(ackTopic,
                    AckMessage.error(envelope.getSerialNum(), msg.getPlant_id(), msg.getMsg_id(), "SENSOR_UPLINK",
                            ackMsgId, AckMessage.AckErrorCode.PLANT_DEVICE_MISMATCH, bindingMismatch.getMessage()));
        } catch (Exception ex) {
            mqttPublisher.publish(ackTopic,
                    AckMessage.error(envelope.getSerialNum(), msg.getPlant_id(), msg.getMsg_id(), "SENSOR_UPLINK",
                            ackMsgId, AckMessage.AckErrorCode.SERVER_TEMP_UNAVAILABLE, "temporary error"));
        }
    }
}