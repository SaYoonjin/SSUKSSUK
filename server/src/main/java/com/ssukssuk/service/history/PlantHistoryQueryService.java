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

    public PlantHistoryResponse getPlantHistory(Long userId, Long plantId, Integer period) {

        // period는 스펙상 14 고정이면 강제
        int p = 14;

        // 1) 소유 검증 + plantName 확보 (한 번에 처리)
        UserPlant up = userPlantRepository.findByPlantIdAndUserId(plantId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.FORBIDDEN));

        String plantName = up.getPlantName(); // UserPlant에 plantName 필드가 있다고 가정

        // 2) 각 파트 조립 (각 서비스는 단일 책임)
        PlantHistoryResponse.CurrentImage currentImage =
                plantImageQueryService.getLatestTopSideImage(plantId);

        PlantHistoryResponse.GrowthGraph growthGraph =
                imageInferenceService.getGrowthGraph(plantId, p);

        PlantHistoryResponse.SensorAlertGraph sensorAlertGraph =
                sensorEventService.getSensorAlertGraph(plantId, p);

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