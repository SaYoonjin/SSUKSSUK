package com.ssukssuk.service.history;

import com.ssukssuk.common.mqtt.dto.SensorUplinkMessage;
import com.ssukssuk.domain.history.ActionLog;
import com.ssukssuk.domain.history.SensorEvent;
import com.ssukssuk.repository.history.ActionLogRepository;
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

    private final ActionLogRepository actionLogRepository;
    private final NotificationService notificationService;

    @Transactional
    public void handleUplink(SensorUplinkMessage msg, LocalDateTime measuredAt) {

        // 1. sensor_log 무조건 INSERT
        Long sensorLogId = sensorLogService.saveFromMqttReturnId(
                msg.getPlantId(),
                measuredAt,
                msg.getTemperature(),
                msg.getHumidity(),
                msg.getWaterLevel(),
                msg.getNutrientConc()
        );

        // 2. event_kind 분기
        if (msg.getEventKind() == null) return;

        switch (msg.getEventKind()) {
            case PERIODIC -> {
                return;
            }

            case ANOMALY_DETECTED -> {
                sensorEventService.openOrUpdate(
                        msg.getPlantId(),
                        msg.getTriggerSensorType(),
                        sensorLogId,
                        measuredAt
                );
            }

            case RECOVERY_DONE -> {
                // resolve 된 이벤트를 받아옴
                Optional<SensorEvent> resolvedOpt = sensorEventService.resolveIfOpenAndReturn(
                        msg.getPlantId(),
                        msg.getTriggerSensorType(),
                        sensorLogId,
                        measuredAt
                );

                if (resolvedOpt.isEmpty()) return;

                SensorEvent resolvedEvent = resolvedOpt.get();
                Long eventId = resolvedEvent.getEventId();

                // 최근 SUCCESS action_log 조회
                Optional<ActionLog> latestSuccessActionOpt =
                        actionLogRepository.findTopByEventIdAndResultStatusOrderByCreatedAtDesc(eventId, "SUCCESS");

                if (latestSuccessActionOpt.isEmpty()) return;

                ActionLog actionLog = latestSuccessActionOpt.get();

                // action_type에 따라 "조치 완료" 인앱 알림 생성
                String actionType = actionLog.getActionType();
                if ("WATER_ADD".equalsIgnoreCase(actionType)) {
                    notificationService.create(
                            msg.getPlantId(),
                            eventId,
                            "WATER_ACTION_DONE",
                            "자동모드: 물 수위가 채워졌습니다."
                    );
                } else if ("NUTRIENT_ADD".equalsIgnoreCase(actionType)) {
                    notificationService.create(
                            msg.getPlantId(),
                            eventId,
                            "NUTRIENT_ACTION_DONE",
                            "자동모드: 영양분이 보충되었습니다."
                    );
                }
            }
        }
    }
}