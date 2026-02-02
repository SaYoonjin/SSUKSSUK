package com.ssukssuk.service.plant;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.history.SensorLog;
import com.ssukssuk.dto.plant.NutrientCardResponse;
import com.ssukssuk.repository.history.SensorLogRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NutrientSensorService {

    private final UserPlantRepository userPlantRepository;
    private final SensorLogRepository sensorLogRepository;

    public NutrientCardResponse getNutrientCard(Long plantId) {

        Float idealMin = userPlantRepository.findNutrientMinByPlantId(plantId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));

        Float idealMax = userPlantRepository.findNutrientMaxByPlantId(plantId)
                .orElse(null);

        SensorLog log = sensorLogRepository.findTopByPlant_PlantIdOrderByMeasuredAtDesc(plantId)
                .orElseThrow(() -> new CustomException(ErrorCode.SENSOR_LOG_NOT_FOUND));

        Float currentNutrient = log.getNutrientConc();

        return NutrientCardResponse.of(
                plantId,
                log.getMeasuredAt(),
                currentNutrient,
                idealMin,
                idealMax
        );
    }
}
