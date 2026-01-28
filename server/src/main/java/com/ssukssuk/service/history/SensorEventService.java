package com.ssukssuk.service.history;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.infra.mqtt.dto.SensorUplinkMessage;
import com.ssukssuk.domain.history.SensorEvent;
import com.ssukssuk.domain.history.SensorLog;
import com.ssukssuk.domain.plant.UserPlant;
import com.ssukssuk.repository.history.SensorEventRepository;
import com.ssukssuk.repository.history.SensorLogRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SensorEventService {

    private final SensorEventRepository sensorEventRepository;
    private final SensorLogRepository sensorLogRepository;
    private final UserPlantRepository userPlantRepository;

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
            UserPlant plant = userPlantRepository.findById(plantId)
                    .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));
            SensorLog sensorLog = sensorLogRepository.findById(sensorLogId)
                    .orElseThrow(() -> new CustomException(ErrorCode.SENSOR_LOG_NOT_FOUND));

            SensorEvent created = SensorEvent.open(plant, sensorCode, sensorLog, measuredAt);
            sensorEventRepository.save(created);
            return Optional.of(created);
        } else {
            SensorLog sensorLog = sensorLogRepository.findById(sensorLogId)
                    .orElseThrow(() -> new CustomException(ErrorCode.SENSOR_LOG_NOT_FOUND));
            openEvent.updateLast(sensorLog);
            return Optional.empty();
        }
    }

    // RECOVERY_DONE
    @Transactional
    public void resolveIfOpenAndReturn(
            Long plantId,
            SensorUplinkMessage.TriggerSensorType triggerType,
            Long sensorLogId,
            LocalDateTime measuredAt
    ) {
        Integer sensorCode = mapToSensorCode(triggerType);

        Optional<SensorEvent> openEventOpt =
                sensorEventRepository.findOpenByPlantIdAndSensorCode(plantId, sensorCode);

        openEventOpt.ifPresent(event -> {
            SensorLog sensorLog = sensorLogRepository.findById(sensorLogId)
                    .orElseThrow(() -> new CustomException(ErrorCode.SENSOR_LOG_NOT_FOUND));
            event.resolve(sensorLog, measuredAt);
        });
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