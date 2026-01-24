package com.ssukssuk.service.history;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.history.SensorLog;
import com.ssukssuk.dto.history.SensorLogRequest;
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

    public void saveSensorLog(SensorLogRequest request) {

        if (!userPlantRepository.existsById(request.getPlantId())) {
            throw new CustomException(ErrorCode.PLANT_NOT_FOUND);
        }

        SensorLog log = SensorLog.builder()
                .plantId(request.getPlantId())
                .measuredAt(
                        request.getMeasuredAt() != null
                                ? request.getMeasuredAt()
                                : LocalDateTime.now()
                )
                .temperature(request.getTemperature())
                .humidity(request.getHumidity())
                .waterLevel(request.getWaterLevel())
                .nutrientConc(request.getNutrientConc())
                .receivedAt(LocalDateTime.now())
                .build();

        sensorLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public SensorLogResponse getLatestSensor(Long plantId) {

        SensorLog log = sensorLogRepository
                .findTopByPlantIdOrderByMeasuredAtDesc(plantId)
                .orElseThrow(() ->
                        new CustomException(ErrorCode.SENSOR_LOG_NOT_FOUND)
                );

        return SensorLogResponse.builder()
                .measuredAt(log.getMeasuredAt())
                .temperature(log.getTemperature())
                .humidity(log.getHumidity())
                .waterLevel(log.getWaterLevel())
                .nutrientConc(log.getNutrientConc())
                .build();
    }

}
