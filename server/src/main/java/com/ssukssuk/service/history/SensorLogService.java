package com.ssukssuk.service.history;

import com.ssukssuk.domain.history.SensorLog;
import com.ssukssuk.dto.history.SensorLogRequest;
import com.ssukssuk.dto.history.SensorLogResponse;
import com.ssukssuk.repository.history.SensorLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class SensorLogService {

    private final SensorLogRepository sensorLogRepository;

    /**
     * 센서 로그 저장 (MQTT or API)
     */
    public void saveSensorLog(SensorLogRequest request) {
        SensorLog log = SensorLog.builder()
                .plantId(request.getPlantId())
                .sensorTypeCode(request.getSensorTypeCode())
                .value(request.getValue())
                .measuredAt(request.getMeasuredAt())
                .receivedAt(LocalDateTime.now())
                .build();

        sensorLogRepository.save(log);
    }

    /**
     * 최신 센서 값 조회
     */
    @Transactional(readOnly = true)
    public SensorLogResponse getLatestSensor(
            Long plantId,
            Integer sensorTypeCode
    ) {
        SensorLog log = sensorLogRepository
                .findTopByPlantIdAndSensorTypeCodeOrderByMeasuredAtDesc(
                        plantId, sensorTypeCode)
                .orElseThrow(() ->
                        new IllegalArgumentException("센서 데이터가 존재하지 않습니다.")
                );

        return SensorLogResponse.builder()
                .sensorTypeCode(log.getSensorTypeCode())
                .value(log.getValue())
                .measuredAt(log.getMeasuredAt())
                .build();
    }
}

