package com.ssukssuk.controller.history;

import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.dto.history.GetPlantImagesResponse;
import com.ssukssuk.dto.history.PlantHistoryResponse;
import com.ssukssuk.dto.history.SensorLogResponse;
import com.ssukssuk.service.history.PlantHistoryQueryService;
import com.ssukssuk.service.history.PlantImageQueryService;
import com.ssukssuk.service.history.SensorLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class HistoryController {

    private final SensorLogService sensorLogService;
    private final PlantImageQueryService plantImageQueryService;
    private final PlantHistoryQueryService plantHistoryQueryService;

    @GetMapping("/{plantId}/sensors/latest")
    public ResponseEntity<SensorLogResponse> getLatestSensor(
            @PathVariable Long plantId
    ) {
        return ResponseEntity.ok(
                sensorLogService.getLatestSensor(plantId)
        );
    }

    // 특정 식물의 최근 14일간 촬영된 이미지 목록 조회 (소유자 검증 포함)
    @GetMapping("/plants/{plantId}/images")
    public ResponseEntity<ApiResponse<GetPlantImagesResponse>> getPlantImages(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long plantId
    ) {
        GetPlantImagesResponse data = plantImageQueryService.getRecent14DaysImages(userId, plantId);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    // 히스토리 메인 화면 api
    @GetMapping("/plants/{plantId}")
    public ResponseEntity<ApiResponse<PlantHistoryResponse>> getPlantHistory(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long plantId
    ) {
        PlantHistoryResponse data =
                plantHistoryQueryService.getPlantHistory(userId, plantId);

        return ResponseEntity.ok(ApiResponse.ok(data));
    }

}