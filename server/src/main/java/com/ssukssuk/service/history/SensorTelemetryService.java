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

        // 1) sensor_log 무조건 INSERT (status 포함)
        Long sensorLogId = sensorLogService.saveFromMqttReturnId(msg, measuredAt);

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
                    Notification.NotiTitle title =
                            mapTriggerToNotiTitle(msg.getTriggerSensorType());

                    notificationService.notifySensorAnomaly(
                            msg.getPlantId(),
                            createdEvent.getEventId(),
                            title
                    );
                });
            }

            case RECOVERY_DONE -> {
                Optional<SensorEvent> resolvedOpt =
                        sensorEventService.resolveIfOpenAndReturn(
                            msg.getPlantId(),
                            msg.getTriggerSensorType(),
                            sensorLogId,
                            measuredAt
                        );

                // 열려있는 이벤트 있으면 종료하고 -> 복구 알림 생성
                // 없으면 아무것도 안함
                resolvedOpt.ifPresent(resolvedEvent -> {
                    Notification.NotiTitle title =
                            mapTriggerToRecoveryTitle(msg.getTriggerSensorType());

                    notificationService.notifySensorRecovery(
                            msg.getPlantId(),
                            resolvedEvent.getEventId(),
                            title
                    );
                });


            }
        }
    }

    private Notification.NotiTitle mapTriggerToNotiTitle(SensorUplinkMessage.TriggerSensorType triggerType) {
        if (triggerType == null) throw new IllegalArgumentException("trigger_sensor_type is null");

        return switch (triggerType) {
            case WATER_LEVEL -> Notification.NotiTitle.WATER_LEVEL;
            case NUTRIENT_CONC -> Notification.NotiTitle.NUTRIENT_CONC;
        };
    }

    private Notification.NotiTitle mapTriggerToRecoveryTitle(SensorUplinkMessage.TriggerSensorType triggerType) {

        if (triggerType == null) throw new IllegalArgumentException("trigger_sensor_type is null");

        return switch (triggerType) {
            case WATER_LEVEL -> Notification.NotiTitle.WATER_LEVEL;
            case NUTRIENT_CONC -> Notification.NotiTitle.NUTRIENT_CONC;
        };

    }
}