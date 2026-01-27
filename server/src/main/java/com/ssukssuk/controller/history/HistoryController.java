package com.ssukssuk.controller.history;

import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.dto.history.LatestPlantImageResponse;
import com.ssukssuk.dto.history.SensorLogRequest;
import com.ssukssuk.dto.history.SensorLogResponse;
import com.ssukssuk.service.history.PlantImageQueryService;
import com.ssukssuk.service.history.SensorLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/history")
@RequiredArgsConstructor
public class HistoryController {

    private final SensorLogService sensorLogService;
    private final PlantImageQueryService plantImageQueryService;

    @PostMapping("/sensor-log")
    public ResponseEntity<Void> saveSensorLog(
            @RequestBody SensorLogRequest request
    ) {
        sensorLogService.saveSensorLog(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/plants/{plantId}/sensor/latest")
    public ResponseEntity<SensorLogResponse> getLatestSensor(
            @PathVariable Long plantId
    ) {
        return ResponseEntity.ok(
                sensorLogService.getLatestSensor(plantId)
        );
    }

    @GetMapping("/plants/{plantId}/images/latest")
    public ApiResponse<LatestPlantImageResponse> getLatestImages(
            @PathVariable Long plantId
    ) {
        LatestPlantImageResponse response =
                plantImageQueryService.getLatestImages(plantId);

        return ApiResponse.ok(response);
    }

}
