package com.ssukssuk.service.history;

import com.ssukssuk.common.mqtt.dto.SensorUplinkMessage;
import com.ssukssuk.domain.history.SensorEvent;
import com.ssukssuk.repository.history.SensorEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SensorEventService {

    private final SensorEventRepository sensorEventRepository;

    // ANOMALY_DETECTED
    @Transactional
    public void openOrUpdate(
            Long plantId,
            SensorUplinkMessage.TriggerSensorType triggerType,
            Long sensorLogId,
            LocalDateTime measuredAt
    ) {
        Integer sensorCode = mapToSensorCode(triggerType);

        SensorEvent openEvent = sensorEventRepository
                .findOpenByPlantIdAndSensorCode(plantId, sensorCode)
                .orElse(null);

        if (openEvent == null) {
            SensorEvent created = SensorEvent.open(
                    plantId,
                    sensorCode,
                    sensorLogId,
                    measuredAt
            );
            sensorEventRepository.save(created);
        } else {
            openEvent.updateLast(sensorLogId);
        }
    }

    // RECOVERY_DONE
    @Transactional
    public void resolveIfOpen(
            Long plantId,
            SensorUplinkMessage.TriggerSensorType triggerType,
            Long sensorLogId,
            LocalDateTime measuredAt
    ) {
        Integer sensorCode = mapToSensorCode(triggerType);

        sensorEventRepository
                .findOpenByPlantIdAndSensorCode(plantId, sensorCode)
                .ifPresent(event ->
                        event.resolve(sensorLogId, measuredAt)
                );
    }

    // trigger_sensor_type → sensor_code 매핑
    public Integer mapToSensorCode(SensorUplinkMessage.TriggerSensorType type) {
        if (type == null) {
            throw new IllegalArgumentException("trigger_sensor_type is null");
        }

        return switch (type) {
            case TEMPERATURE -> 1;
            case HUMIDITY -> 2;
            case WATER_LEVEL -> 3;
            case NUTRIENT_CONC -> 4;
        };
    }
}