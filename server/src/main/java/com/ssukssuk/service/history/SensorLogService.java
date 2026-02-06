package com.ssukssuk.service.history;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.history.SensorLog;
import com.ssukssuk.domain.plant.UserPlant;
import com.ssukssuk.dto.history.SensorLogResponse;
import com.ssukssuk.infra.mqtt.dto.SensorUplinkMessage;
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

    // MQTT 수신용 - status 포함 버전
    public Long saveFromMqttReturnId(SensorUplinkMessage msg, LocalDateTime measuredAt) {
        UserPlant plant = userPlantRepository.findById(msg.getPlantId())
                .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));

        SensorLog log = SensorLog.builder()
                .plant(plant)
                .measuredAt(measuredAt != null ? measuredAt : LocalDateTime.now())
                .temperature(msg.getTemperature())
                .humidity(msg.getHumidity())
                .waterLevel(msg.getWaterLevel())
                .nutrientConc(msg.getNutrientConc())
                .temperatureStatus(convertStatus(msg.getTemperatureStatus()))
                .humidityStatus(convertStatus(msg.getHumidityStatus()))
                .waterLevelStatus(convertStatus(msg.getWaterLevelStatus()))
                .nutrientConcStatus(convertStatus(msg.getNutrientConcStatus()))
                .receivedAt(LocalDateTime.now())
                .build();

        return sensorLogRepository.save(log).getSensorLogId();
    }

    private SensorLog.SensorStatus convertStatus(SensorUplinkMessage.SensorStatus status) {
        if (status == null) return null;
        return switch (status) {
            case OK -> SensorLog.SensorStatus.OK;
            case UP -> SensorLog.SensorStatus.UP;
            case DOWN -> SensorLog.SensorStatus.DOWN;
        };
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
