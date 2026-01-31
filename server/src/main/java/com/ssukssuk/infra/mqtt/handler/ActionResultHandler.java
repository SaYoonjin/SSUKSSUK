package com.ssukssuk.infra.mqtt.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssukssuk.infra.mqtt.dto.ActionResultMessage;
import com.ssukssuk.infra.mqtt.dto.MqttEnvelope;
import com.ssukssuk.infra.idempotency.IdempotencyService;
import com.ssukssuk.repository.history.SensorEventRepository;
import com.ssukssuk.service.device.DeviceBindingValidator;
import com.ssukssuk.service.history.ActionLogService;
import com.ssukssuk.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Slf4j
@Component("action-result")
@RequiredArgsConstructor
public class ActionResultHandler implements MqttMessageHandler {

    private static final int SENSOR_CODE_WATER_LEVEL = 3;
    private static final int SENSOR_CODE_NUTRIENT_CONC = 4;

    private final ObjectMapper objectMapper;
    private final IdempotencyService idempotencyService;
    private final DeviceBindingValidator deviceBindingValidator;

    private final SensorEventRepository sensorEventRepository;
    private final ActionLogService actionLogService;
    private final NotificationService notificationService;

    @Override
    public void handle(MqttEnvelope envelope) {

        if (envelope.getDirection() != MqttEnvelope.Direction.TELEMETRY) return;

        ActionResultMessage msg;
        try {
            msg = objectMapper.treeToValue(envelope.getPayloadJson(), ActionResultMessage.class);
        } catch (Exception e) {
            log.warn("[MQTT][ACTION_RESULT] JSON parse failed. topic={}, payload={}",
                    envelope.getTopicRaw(), envelope.getPayloadJson(), e);
            return;
        }

        String serial = envelope.getSerialNum();
        log.info("[MQTT][ACTION_RESULT] received. serial={}, msgId={}, plantId={}",
                serial, msg.getMsgId(), msg.getPlantId());

        if (msg.getPlantId() == null) {
            log.warn("[MQTT][ACTION_RESULT] plant_id is null. msgId={}", msg.getMsgId());
            return;
        }

        // 멱등키: serial:msg_id
        String key = serial + ":" + msg.getMsgId();
        if (!idempotencyService.markIfFirst(key)) {
            log.info("[MQTT][ACTION_RESULT] duplicate ignored: {}", key);
            return;
        }

        try {
            // 디바이스-식물 검증
            deviceBindingValidator.validate(serial, msg.getPlantId());

            // sent_at 파싱
            LocalDateTime occurredAt =
                    msg.getSentAt() != null
                            ? OffsetDateTime.parse(msg.getSentAt())
                            .atZoneSameInstant(ZoneId.of("Asia/Seoul"))
                            .toLocalDateTime()
                            : LocalDateTime.now();

            // action_type → sensor_event.sensor_code 매핑
            int sensorCode = mapToSensorCode(msg.getActionType());

            // OPEN 이벤트 찾기
            var sensorEvent = sensorEventRepository
                    .findTopByPlant_PlantIdAndSensorCodeAndStateOrderByStartedAtDesc(
                            msg.getPlantId(), sensorCode, true
                    )
                    .orElseThrow(() -> new IllegalStateException(
                            "OPEN sensor_event not found. plantId=" + msg.getPlantId() + ", sensorCode=" + sensorCode
                    ));

            // action_log INSERT (SUCCESS/FAIL 모두)
            actionLogService.record(msg, sensorEvent, occurredAt);

            if ("SUCCESS".equalsIgnoreCase(msg.getResultStatus())) {
                notificationService.notifyActionDone(msg.getPlantId(), sensorEvent.getEventId());
            } else {
                notificationService.notifyActionFail(msg.getPlantId(), sensorEvent.getEventId());
            }

            log.info("[MQTT][ACTION_RESULT] action_log saved. eventId={},  actionType={}, result={}",
                    sensorEvent.getEventId(), msg.getActionType(), msg.getResultStatus());

        } catch (Exception e) {
            log.error("[MQTT][ACTION_RESULT] processing error", e);
        }
    }

    private int mapToSensorCode(String actionType) {
        if (actionType == null) throw new IllegalArgumentException("action_type is null");

        if ("WATER_ADD".equalsIgnoreCase(actionType)) return SENSOR_CODE_WATER_LEVEL;
        if ("NUTRIENT_ADD".equalsIgnoreCase(actionType)) return SENSOR_CODE_NUTRIENT_CONC;

        throw new IllegalArgumentException("Unknown action_type: " + actionType);
    }
}