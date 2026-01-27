package com.ssukssuk.controller.history;

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

    @GetMapping("/plants/{plantId}/sensor/latest")
    public ResponseEntity<SensorLogResponse> getLatestSensor(
            @PathVariable Long plantId
    ) {
        return ResponseEntity.ok(
                sensorLogService.getLatestSensor(plantId)
        );
    }

}
