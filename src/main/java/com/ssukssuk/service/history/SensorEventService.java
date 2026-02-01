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
        SensorEvent openEvent = sensorEventRepository
                .findOpenByPlantIdAndSensorCode(plantId, triggerType.getCode())
                .orElse(null);

        // 열린 이벤트 없으면 이벤트 생성 / 있으면 갱신만
        if (openEvent == null) {
            UserPlant plant = userPlantRepository.findById(plantId)
                    .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));
            SensorLog sensorLog = sensorLogRepository.findById(sensorLogId)
                    .orElseThrow(() -> new CustomException(ErrorCode.SENSOR_LOG_NOT_FOUND));

            SensorEvent created = SensorEvent.open(plant, triggerType.getCode(), sensorLog, measuredAt);
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
    public Optional<SensorEvent> resolveIfOpenAndReturn(
            Long plantId,
            SensorUplinkMessage.TriggerSensorType triggerType,
            Long sensorLogId,
            LocalDateTime measuredAt
    ) {
        // 이벤트 찾아서
        Optional<SensorEvent> openEventOpt =
                sensorEventRepository.findOpenByPlantIdAndSensorCode(
                        plantId, triggerType.getCode()
                );

        // 없으면 empty 반환
        if (openEventOpt.isEmpty()) {
            return Optional.empty();
        }

        // 있으면 이벤트 닫고 이벤트 Id 반환
        SensorEvent event = openEventOpt.get();

        SensorLog sensorLog = sensorLogRepository.findById(sensorLogId)
                .orElseThrow(() -> new CustomException(ErrorCode.SENSOR_LOG_NOT_FOUND));
        event.resolve(sensorLog, measuredAt);

        return Optional.of(event);
    }
}