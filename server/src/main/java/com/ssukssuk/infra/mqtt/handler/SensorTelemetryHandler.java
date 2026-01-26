package com.ssukssuk.infra.mqtt.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssukssuk.common.mqtt.dto.AckMessage;
import com.ssukssuk.common.mqtt.dto.MqttEnvelope;
import com.ssukssuk.common.mqtt.dto.SensorUplinkMessage;
import com.ssukssuk.infra.idempotency.IdempotencyService;
import com.ssukssuk.infra.mqtt.MqttPublisher;
import com.ssukssuk.service.device.DeviceBindingValidator;
import com.ssukssuk.service.history.SensorLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Slf4j
@Component("sensors")
@RequiredArgsConstructor
public class SensorTelemetryHandler implements MqttMessageHandler {

    private final ObjectMapper objectMapper;
    private final IdempotencyService idempotencyService;
    private final MqttPublisher mqttPublisher;
    private final DeviceBindingValidator deviceBindingValidator;
    private final SensorLogService sensorLogService;

    @Override
    public void handle(MqttEnvelope envelope) {

        if (envelope.getDirection() != MqttEnvelope.Direction.TELEMETRY) {
            return;
        }

        // 1. Payload 파싱
        SensorUplinkMessage msg;
        try {
            msg = objectMapper.treeToValue(
                    envelope.getPayloadJson(),
                    SensorUplinkMessage.class
            );
        } catch (Exception e) {
            log.warn("[MQTT][SENSOR] JSON parse failed. topic={}, payload={}",
                    envelope.getTopicRaw(),
                    envelope.getPayloadJson(),
                    e);
            return;
        }

        String serial = envelope.getSerialNum();
        String ackTopic = MqttPublisher.ackTopic(serial);
        String ackMsgId = UUID.randomUUID().toString();

        log.info("[MQTT][SENSOR] received. serial={}, msgId={}",
                serial, msg.getMsgId());

        // 2. plant_id 검증
        if (msg.getPlantId() == null) {
            mqttPublisher.publish(
                    ackTopic,
                    AckMessage.error(
                            serial,
                            null,
                            msg.getMsgId(),
                            "SENSOR_UPLINK",
                            ackMsgId,
                            AckMessage.AckErrorCode.PLANT_NOT_BOUND,
                            "plant_id is null"
                    )
            );
            return;
        }

        // 3. 멱등 처리
        String idempotencyKey = serial + ":" + msg.getMsgId();
        if (!idempotencyService.markIfFirst(idempotencyKey)) {

            log.info("[MQTT][SENSOR] duplicate ignored: {}", idempotencyKey);

            mqttPublisher.publish(
                    ackTopic,
                    AckMessage.droppedDuplicate(
                            serial,
                            msg.getPlantId(),
                            msg.getMsgId(),
                            "SENSOR_UPLINK",
                            ackMsgId
                    )
            );
            return;
        }

        // 4. 실제 처리
        try {
            // 4-1. 디바이스-식물 검증
            deviceBindingValidator.validate(serial, msg.getPlantId());

            // 4-2. 측정 시각 파싱
            LocalDateTime measuredAt =
                    msg.getSentAt() != null
                            ? OffsetDateTime.parse(msg.getSentAt()).toLocalDateTime()
                            : LocalDateTime.now();

            // 4-3. 센서 로그 저장
            sensorLogService.saveFromMqtt(
                    msg.getPlantId(),
                    measuredAt,
                    msg.getTemperature(),
                    msg.getHumidity(),
                    msg.getWaterLevel(),
                    msg.getNutrientConc()
            );

            // 4-4. ACK 성공
            mqttPublisher.publish(
                    ackTopic,
                    AckMessage.ok(
                            serial,
                            msg.getPlantId(),
                            msg.getMsgId(),
                            "SENSOR_UPLINK",
                            ackMsgId
                    )
            );

            log.info("[MQTT][SENSOR] ACK OK. serial={}, plantId={}",
                    serial, msg.getPlantId());

        }
        // 5. 예외 처리
        catch (IllegalStateException e) {
            log.warn("[MQTT][SENSOR] validation failed: {}", e.getMessage());

            mqttPublisher.publish(
                    ackTopic,
                    AckMessage.error(
                            serial,
                            msg.getPlantId(),
                            msg.getMsgId(),
                            "SENSOR_UPLINK",
                            ackMsgId,
                            AckMessage.AckErrorCode.PLANT_DEVICE_MISMATCH,
                            e.getMessage()
                    )
            );
        }
        catch (Exception e) {
            log.error("[MQTT][SENSOR] processing error", e);

            mqttPublisher.publish(
                    ackTopic,
                    AckMessage.error(
                            serial,
                            msg.getPlantId(),
                            msg.getMsgId(),
                            "SENSOR_UPLINK",
                            ackMsgId,
                            AckMessage.AckErrorCode.SERVER_TEMP_UNAVAILABLE,
                            e.getMessage()
                    )
            );
        }
    }
}
