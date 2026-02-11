package com.ssukssuk.service.plant;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.history.SensorLog;
import com.ssukssuk.dto.plant.WaterCardResponse;
import com.ssukssuk.repository.history.SensorLogRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WaterSensorService {

    private final UserPlantRepository userPlantRepository;
    private final SensorLogRepository sensorLogRepository;

    public WaterCardResponse getWaterCard(Long userId, Long plantId) {

        // 본인 식물 + 삭제 안 된 식물 검증
        userPlantRepository.findByPlantIdAndUserId(plantId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));

        Float idealMin = userPlantRepository.findWaterMinByPlantId(plantId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));

        Float idealMax = userPlantRepository.findWaterMaxByPlantId(plantId)
                .orElse(null);

        SensorLog log = sensorLogRepository.findTopByPlant_PlantIdOrderByMeasuredAtDesc(plantId)
                .orElseThrow(() -> new CustomException(ErrorCode.SENSOR_LOG_NOT_FOUND));

        Float currentWater = log.getWaterLevel();

        return WaterCardResponse.of(
                plantId,
                log.getMeasuredAt(),
                currentWater,
                idealMin,
                idealMax
        );
    }
}
