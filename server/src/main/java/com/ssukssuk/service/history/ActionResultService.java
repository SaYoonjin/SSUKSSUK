package com.ssukssuk.service.history;

import com.ssukssuk.infra.mqtt.dto.ActionResultMessage;
import com.ssukssuk.infra.mqtt.dto.MqttEnvelope;
import com.ssukssuk.repository.history.SensorEventRepository;
import com.ssukssuk.service.device.DeviceBindingValidator;
import com.ssukssuk.service.notification.NotificationService;
import com.ssukssuk.service.plant.PlantStatusService;
import com.ssukssuk.service.push.PushService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActionResultService {

    private static final int SENSOR_CODE_WATER_LEVEL = 1;
    private static final int SENSOR_CODE_NUTRIENT_CONC = 2;

    private final DeviceBindingValidator deviceBindingValidator;
    private final SensorEventRepository sensorEventRepository;
    private final ActionLogService actionLogService;
    private final NotificationService notificationService;
    private final PlantStatusService plantStatusService;
    private final PushService pushService;

    @Transactional
    public void handle(MqttEnvelope envelope, ActionResultMessage msg) {

        String serial = envelope.getSerialNum();

        try {
            // 1. 디바이스-식물 검증
            deviceBindingValidator.validate(serial, msg.getPlantId());

            // 2. sent_at 파싱
            LocalDateTime occurredAt =
                    msg.getSentAt() != null
                            ? OffsetDateTime.parse(msg.getSentAt())
                            .atZoneSameInstant(ZoneId.of("Asia/Seoul"))
                            .toLocalDateTime()
                            : LocalDateTime.now();

            // 3. action_type → sensor_code
            int sensorCode = mapToSensorCode(msg.getActionType());

            // 4. OPEN 이벤트 조회
            var sensorEvent = sensorEventRepository
                    .findLatestByPlantIdAndSensorCodeAndState(
                            msg.getPlantId(), sensorCode, true
                    )
                    .orElseThrow(() -> new IllegalStateException(
                            "OPEN sensor_event not found. plantId=" +
                                    msg.getPlantId() + ", sensorCode=" + sensorCode
                    ));

            // 5. action_log INSERT
            actionLogService.record(msg, sensorEvent, occurredAt);

            // 6. notification INSERT
            Long notificationId =
                    "SUCCESS".equalsIgnoreCase(msg.getResultStatus())
                            ? notificationService.notifyActionDoneAndReturnId(
                            msg.getPlantId(), sensorEvent.getEventId())
                            : notificationService.notifyActionFailAndReturnId(
                            msg.getPlantId(), sensorEvent.getEventId());

            // 7. 안읽은 알림 표시
            plantStatusService.markUnreadNotification(msg.getPlantId());

            // 8. AFTER COMMIT 푸시
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            pushService.sendNotification(notificationId);
                        }
                    }
            );

            log.info("[ACTION_RESULT] processed. eventId={}, actionType={}, result={}",
                    sensorEvent.getEventId(),
                    msg.getActionType(),
                    msg.getResultStatus());

        } catch (Exception e) {
            log.error("[ACTION_RESULT] processing error. msgId={}", msg.getMsgId(), e);
            throw e;
        }
    }

    private int mapToSensorCode(String actionType) {
        if (actionType == null) throw new IllegalArgumentException("action_type is null");

        return switch (actionType.toUpperCase()) {
            case "WATER_ADD" -> SENSOR_CODE_WATER_LEVEL;
            case "NUTRI_ADD" -> SENSOR_CODE_NUTRIENT_CONC;
            default -> throw new IllegalArgumentException("Unknown action_type: " + actionType);
        };
    }
}
