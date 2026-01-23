package com.ssukssuk.controller.history;

import com.ssukssuk.dto.history.SensorLogRequest;
import com.ssukssuk.dto.history.SensorLogResponse;
import com.ssukssuk.service.history.SensorLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/history")
@RequiredArgsConstructor
public class HistoryController {

    private final SensorLogService sensorLogService;

    @PostMapping("/sensor-log")
    public ResponseEntity<Void> saveSensorLog(
            @RequestBody SensorLogRequest request
    ) {
        sensorLogService.saveSensorLog(request);
        return ResponseEntity.ok().build();
    }

    /**
     * 최신 센서 데이터 조회
     */
    @GetMapping("/plants/{plantId}/sensor/latest")
    public ResponseEntity<SensorLogResponse> getLatestSensor(
            @PathVariable Long plantId,
            @RequestParam Integer sensorTypeCode
    ) {
        return ResponseEntity.ok(
                sensorLogService.getLatestSensor(plantId, sensorTypeCode)
        );
    }
}
