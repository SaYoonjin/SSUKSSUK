package com.ssukssuk.infra.mqtt.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssukssuk.infra.mqtt.dto.MqttEnvelope;
import com.ssukssuk.infra.mqtt.dto.SensorUplinkMessage;
import com.ssukssuk.infra.idempotency.IdempotencyService;
import com.ssukssuk.service.device.DeviceBindingValidator;
import com.ssukssuk.service.history.SensorTelemetryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Slf4j
@Component("sensors")
@RequiredArgsConstructor
public class SensorTelemetryHandler implements MqttMessageHandler {

    private final ObjectMapper objectMapper;
    private final IdempotencyService idempotencyService;
    private final DeviceBindingValidator deviceBindingValidator;
    private final SensorTelemetryService sensorTelemetryService;

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

        log.info("[MQTT][SENSOR] received. serial={}, msgId={}, eventKind={}",
                serial, msg.getMsgId(), msg.getEventKind());

        // 2. plant_id 검증
        if (msg.getPlantId() == null) {
            log.warn("[MQTT][SENSOR] plant_id is null. serial={}", serial);
            return;
        }

        // 3. 멱등 처리
        String idempotencyKey = serial + ":" + msg.getMsgId();
        if (!idempotencyService.markIfFirst(idempotencyKey)) {
            log.info("[MQTT][SENSOR] duplicate ignored: {}", idempotencyKey);
            return;
        }

        // 4. 실제 처리 (ACK 없음)
        try {
            // 4-1. 디바이스-식물 검증
            deviceBindingValidator.validate(serial, msg.getPlantId());

            // 4-2. 측정 시각 파싱
            LocalDateTime measuredAt =
                    msg.getSentAt() != null
                            ? OffsetDateTime.parse(msg.getSentAt())
                            .atZoneSameInstant(ZoneId.of("Asia/Seoul"))
                            .toLocalDateTime()
                            : LocalDateTime.now();

            // 4-3. 센서 로그 저장 + 이벤트 처리(OPEN/RESOLVE) 모두 위임
            sensorTelemetryService.handleUplink(msg, measuredAt);

            log.info("[MQTT][SENSOR] processed. serial={}, plantId={}, eventKind={}",
                    serial, msg.getPlantId(), msg.getEventKind());

        } catch (IllegalStateException e) {
            log.warn("[MQTT][SENSOR] validation failed: {}", e.getMessage());
        } catch (Exception e) {
            log.error("[MQTT][SENSOR] processing error. serial={}, msgId={}",
                    serial, msg.getMsgId(), e);
        }
    }
}