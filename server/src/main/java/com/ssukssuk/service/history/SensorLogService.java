package com.ssukssuk.service.history;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.history.SensorLog;
import com.ssukssuk.domain.plant.UserPlant;
import com.ssukssuk.dto.history.SensorLogResponse;
import com.ssukssuk.repository.history.SensorLogRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class SensorLogService {

    private final SensorLogRepository sensorLogRepository;
    private final UserPlantRepository userPlantRepository;

    // MQTT 수신용 (SensorTelemetryHandler에서 호출)
    public void saveFromMqtt(
            Long plantId,
            LocalDateTime measuredAt,
            Float temperature,
            Float humidity,
            Float waterLevel,
            Float nutrientConc
    ) {
        UserPlant plant = userPlantRepository.findById(plantId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));

        SensorLog log = SensorLog.builder()
                .plant(plant)
                .measuredAt(measuredAt != null ? measuredAt : LocalDateTime.now())
                .temperature(temperature)
                .humidity(humidity)
                .waterLevel(waterLevel)
                .nutrientConc(nutrientConc)
                .receivedAt(LocalDateTime.now())
                .build();

        sensorLogRepository.save(log);
    }

    // MQTT 수신용 - sensor_event 연동을 위해 PK 반환 버전 추가
    public Long saveFromMqttReturnId(
            Long plantId,
            LocalDateTime measuredAt,
            Float temperature,
            Float humidity,
            Float waterLevel,
            Float nutrientConc
    ) {
        UserPlant plant = userPlantRepository.findById(plantId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));

        SensorLog log = SensorLog.builder()
                .plant(plant)
                .measuredAt(measuredAt != null ? measuredAt : LocalDateTime.now())
                .temperature(temperature)
                .humidity(humidity)
                .waterLevel(waterLevel)
                .nutrientConc(nutrientConc)
                .receivedAt(LocalDateTime.now())
                .build();

        return sensorLogRepository.save(log).getSensorLogId();
    }

    // 최신 센서값 조회
    @Transactional(readOnly = true)
    public SensorLogResponse getLatestSensor(Long plantId) {
        SensorLog log = sensorLogRepository
                .findTopByPlant_PlantIdOrderByMeasuredAtDesc(plantId)
                .orElseThrow(() -> new CustomException(ErrorCode.SENSOR_LOG_NOT_FOUND));

        return SensorLogResponse.builder()
                .measuredAt(log.getMeasuredAt())
                .temperature(log.getTemperature())
                .humidity(log.getHumidity())
                .waterLevel(log.getWaterLevel())
                .nutrientConc(log.getNutrientConc())
                .build();
    }
}
