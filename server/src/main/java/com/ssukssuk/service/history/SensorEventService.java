package com.ssukssuk.service.history;

import com.ssukssuk.common.mqtt.dto.SensorUplinkMessage;
import com.ssukssuk.domain.history.SensorEvent;
import com.ssukssuk.repository.history.SensorEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SensorEventService {

    private final SensorEventRepository sensorEventRepository;

    // ANOMALY_DETECTED
    @Transactional
    public Optional<SensorEvent> openOrUpdateAndReturnCreated(
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
            SensorEvent created = SensorEvent.open(plantId, sensorCode, sensorLogId, measuredAt);
            sensorEventRepository.save(created);
            return Optional.of(created);
        } else {
            openEvent.updateLast(sensorLogId);
            return Optional.empty();
        }
    }

    // RECOVERY_DONE
    @Transactional
    public Optional<SensorEvent> resolveIfOpenAndReturn(
            Long plantId,
            SensorUplinkMessage.TriggerSensorType triggerType,
            Long sensorLogId,
            LocalDateTime measuredAt
    ) {
        Integer sensorCode = mapToSensorCode(triggerType);

        Optional<SensorEvent> openEventOpt =
                sensorEventRepository.findOpenByPlantIdAndSensorCode(plantId, sensorCode);

        openEventOpt.ifPresent(event -> event.resolve(sensorLogId, measuredAt));
        return openEventOpt;
    }

    public Integer mapToSensorCode(SensorUplinkMessage.TriggerSensorType type) {
        if (type == null) throw new IllegalArgumentException("trigger_sensor_type is null");

        return switch (type) {
            case TEMPERATURE -> 1;
            case HUMIDITY -> 2;
            case WATER_LEVEL -> 3;
            case NUTRIENT_CONC -> 4;
        };
    }
}