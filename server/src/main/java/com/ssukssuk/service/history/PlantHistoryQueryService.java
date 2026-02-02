package com.ssukssuk.service.history;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.dto.history.PlantHistoryResponse;
import com.ssukssuk.domain.plant.UserPlant;
import com.ssukssuk.repository.plant.UserPlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlantHistoryQueryService {

    private final UserPlantRepository userPlantRepository;

    private final PlantImageQueryService plantImageQueryService;
    private final ImageInferenceService imageInferenceService;
    private final SensorEventService sensorEventService;

    public PlantHistoryResponse getPlantHistory(Long userId, Long plantId) {

        // 1) 소유 검증 + plantName 확보
        UserPlant up = userPlantRepository.findByPlantIdAndUserId(plantId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLANT_ACCESS_DENIED));

        String plantName = up.getPlantName();

        // 2) 각 파트 조립
        PlantHistoryResponse.CurrentImage currentImage =
                plantImageQueryService.getLatestTopSideImage(userId, plantId);

        PlantHistoryResponse.GrowthGraph growthGraph =
                imageInferenceService.getGrowthGraph14Days(plantId);

        PlantHistoryResponse.SensorAlertGraph sensorAlertGraph =
                sensorEventService.getSensorAlertGraph14Days(plantId);

        // 3) 최종 응답
        return PlantHistoryResponse.builder()
                .plantId(plantId)
                .plantName(plantName)
                .currentImage(currentImage)
                .growthGraph(growthGraph)
                .sensorAlertGraph(sensorAlertGraph)
                .build();
    }
}