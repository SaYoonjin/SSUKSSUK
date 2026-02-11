package com.ssukssuk.service.history;

import com.ssukssuk.infra.mqtt.dto.SensorUplinkMessage;
import com.ssukssuk.domain.history.SensorEvent;
import com.ssukssuk.domain.notification.Notification;
import com.ssukssuk.service.notification.NotificationService;
import com.ssukssuk.service.plant.PlantStatusService;
import com.ssukssuk.service.push.PushService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SensorTelemetryService {

    private final SensorLogService sensorLogService;
    private final SensorEventService sensorEventService;
    private final NotificationService notificationService;
    private final PlantStatusService plantStatusService;
    private final PushService pushService;

    @Transactional
    public void handleUplink(SensorUplinkMessage msg, LocalDateTime measuredAt) {

        // 1) sensor_log 무조건 INSERT (status 포함)
        Long sensorLogId = sensorLogService.saveFromMqttReturnId(msg, measuredAt);

        // 2) PlantStatus 업데이트 (센서값 반영)
        plantStatusService.updateFromSensor(msg.getPlantId(), msg);

        // 3) event_kind 분기
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

                    // notification 테이블에 알림 저장
                    // DB만 저장되고 푸시 안 감
                    Long notificationId =
                        notificationService.notifySensorAnomalyAndReturnId(
                                msg.getPlantId(),
                                createdEvent.getEventId(),
                                title
                        );

                    // AFTER COMMIT 푸시 등록
                    // 트랜잭션 정상 커밋된 경우에만 실행됨
                    TransactionSynchronizationManager.registerSynchronization(
                            new TransactionSynchronization() {
                                @Override
                                public void afterCommit() {
                                    pushService.sendNotification(notificationId);
                                }
                            }
                    );

                    // 안읽은 알림 표시
                    plantStatusService.markUnreadNotification(msg.getPlantId());
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

                    Long notificationId =
                        notificationService.notifySensorRecoveryAndReturnId(
                                msg.getPlantId(),
                                resolvedEvent.getEventId(),
                                title
                        );

                    TransactionSynchronizationManager.registerSynchronization(
                            new TransactionSynchronization() {
                                @Override
                                public void afterCommit() {
                                    pushService.sendNotification(notificationId);
                                }
                            }
                    );
                    // 안읽은 알림 표시
                    plantStatusService.markUnreadNotification(msg.getPlantId());
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