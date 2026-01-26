package com.ssukssuk.service.history;

import com.ssukssuk.common.mqtt.dto.SensorUplinkMessage;
import com.ssukssuk.service.history.SensorEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SensorTelemetryService {

    private final SensorLogService sensorLogService;
    private final SensorEventService sensorEventService;

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
        if (msg.getEventKind() == null) {
            return;
        }

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
                sensorEventService.resolveIfOpen(
                        msg.getPlantId(),
                        msg.getTriggerSensorType(),
                        sensorLogId,
                        measuredAt
                );
            }
        }
    }
}