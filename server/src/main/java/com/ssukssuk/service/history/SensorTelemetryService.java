package com.ssukssuk.service.history;

import com.ssukssuk.infra.mqtt.dto.SensorUplinkMessage;
import com.ssukssuk.domain.history.SensorEvent;
import com.ssukssuk.domain.notification.Notification;
import com.ssukssuk.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SensorTelemetryService {

    private final SensorLogService sensorLogService;
    private final SensorEventService sensorEventService;
    private final NotificationService notificationService;

    @Transactional
    public void handleUplink(SensorUplinkMessage msg, LocalDateTime measuredAt) {

        // 1) sensor_log 무조건 INSERT
        Long sensorLogId = sensorLogService.saveFromMqttReturnId(
                msg.getPlantId(),
                measuredAt,
                msg.getTemperature(),
                msg.getHumidity(),
                msg.getWaterLevel(),
                msg.getNutrientConc()
        );

        // 2) event_kind 분기
        if (msg.getEventKind() == null) return;

        switch (msg.getEventKind()) {
            case PERIODIC -> { /* 정상 주기 데이터 - 추가 처리 없음 */ }

            case ANOMALY_DETECTED -> {
                Optional<SensorEvent> createdOpt = sensorEventService.openOrUpdateAndReturnCreated(
                        msg.getPlantId(),
                        msg.getTriggerSensorType(),
                        sensorLogId,
                        measuredAt
                );

                // 처음 이상치(OPEN 생성)일 때만 알림 테이블 insert
                createdOpt.ifPresent(createdEvent -> {
                    Notification.NotiTitle title = mapTriggerToNotiTitle(msg.getTriggerSensorType());
                    notificationService.notifySensorAnomaly(
                            msg.getPlantId(),
                            createdEvent.getEventId(),
                            title
                    );
                });
            }

            case RECOVERY_DONE -> sensorEventService.resolveIfOpenAndReturn(
                    msg.getPlantId(),
                    msg.getTriggerSensorType(),
                    sensorLogId,
                    measuredAt
            );

            case ANOMALY_FAIL -> sensorEventService.findOpenEventId(
                    msg.getPlantId(),
                    msg.getTriggerSensorType()
            ).ifPresent(eventId ->
                    notificationService.notifyActionFail(msg.getPlantId(), eventId)
            );
        }
    }

    private Notification.NotiTitle mapTriggerToNotiTitle(SensorUplinkMessage.TriggerSensorType triggerType) {
        if (triggerType == null) throw new IllegalArgumentException("trigger_sensor_type is null");

        return switch (triggerType) {
            case WATER_LEVEL -> Notification.NotiTitle.WATER_LEVEL;
            case NUTRIENT_CONC -> Notification.NotiTitle.NUTRIENT_CONC;


        };
    }
}