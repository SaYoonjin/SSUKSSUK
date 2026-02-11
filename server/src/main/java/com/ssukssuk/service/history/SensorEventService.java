package com.ssukssuk.service.history;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.dto.history.PlantHistoryResponse;
import com.ssukssuk.infra.mqtt.dto.SensorUplinkMessage;
import com.ssukssuk.domain.history.SensorEvent;
import com.ssukssuk.domain.history.SensorLog;
import com.ssukssuk.domain.plant.UserPlant;
import com.ssukssuk.repository.history.SensorEventRepository;
import com.ssukssuk.repository.history.SensorLogRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SensorEventService {
    private static final int FIXED_PERIOD_DAYS = 14;
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private static final int WATER_CODE = 1;
    private static final int NUTRIENT_CODE = 2;

    private final SensorEventRepository sensorEventRepository;
    private final SensorLogRepository sensorLogRepository;
    private final UserPlantRepository userPlantRepository;

    // ANOMALY_DETECTED
    @Transactional
    public Optional<SensorEvent> openOrUpdateAndReturnCreated(
            Long plantId,
            SensorUplinkMessage.TriggerSensorType triggerType,
            Long sensorLogId,
            LocalDateTime measuredAt
    ) {
        SensorEvent openEvent = sensorEventRepository
                .findOpenByPlantIdAndSensorCode(plantId, triggerType.getCode())
                .orElse(null);

        // 열린 이벤트 없으면 이벤트 생성 / 있으면 갱신만
        if (openEvent == null) {
            UserPlant plant = userPlantRepository.findById(plantId)
                    .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));
            SensorLog sensorLog = sensorLogRepository.findById(sensorLogId)
                    .orElseThrow(() -> new CustomException(ErrorCode.SENSOR_LOG_NOT_FOUND));

            SensorEvent created = SensorEvent.open(plant, triggerType.getCode(), sensorLog, measuredAt);
            sensorEventRepository.save(created);
            return Optional.of(created);
        } else {
            SensorLog sensorLog = sensorLogRepository.findById(sensorLogId)
                    .orElseThrow(() -> new CustomException(ErrorCode.SENSOR_LOG_NOT_FOUND));
            openEvent.updateLast(sensorLog);
            return Optional.empty();
        }
    }

    // RECOVERY_DONE
    @Transactional
    public Optional<SensorEvent> resolveIfOpenAndReturn(
            Long plantId,
            SensorUplinkMessage.TriggerSensorType triggerType,
            Long sensorLogId,
            LocalDateTime measuredAt
    ) {
        // 이벤트 찾아서
        Optional<SensorEvent> openEventOpt =
                sensorEventRepository.findOpenByPlantIdAndSensorCode(
                        plantId, triggerType.getCode()
                );

        // 없으면 empty 반환
        if (openEventOpt.isEmpty()) {
            return Optional.empty();
        }

        // 있으면 이벤트 닫고 이벤트 Id 반환
        SensorEvent event = openEventOpt.get();

        SensorLog sensorLog = sensorLogRepository.findById(sensorLogId)
                .orElseThrow(() -> new CustomException(ErrorCode.SENSOR_LOG_NOT_FOUND));
        event.resolve(sensorLog, measuredAt);

        return Optional.of(event);
    }

    @Transactional(readOnly = true)
    public PlantHistoryResponse.SensorAlertGraph getSensorAlertGraph14Days(Long plantId) {

        LocalDate end = LocalDate.now(KST);
        LocalDate start = end.minusDays(FIXED_PERIOD_DAYS - 1);

        LocalDateTime startDt = start.atStartOfDay();
        LocalDateTime endExclusive = end.plusDays(1).atStartOfDay();

        // 이상치 오픈된 시간 기준 집계
        List<SensorEvent> events =
                sensorEventRepository.findByPlantIdAndStartedAtBetween(
                        plantId, startDt, endExclusive
                );

        // date, [water, nutrient]
        Map<LocalDate, int[]> map = new HashMap<>();

        for (SensorEvent e : events) {
            LocalDate d = e.getStartedAt().toLocalDate();
            map.putIfAbsent(d, new int[2]);

            int[] c = map.get(d);
            int code = e.getSensorCode();

            if (code == WATER_CODE) {
                c[0]++;
            } else if (code == NUTRIENT_CODE) {
                c[1]++;
            }
        }

        List<PlantHistoryResponse.SensorAlertPoint> data =
                new ArrayList<>(FIXED_PERIOD_DAYS);

        for (int i = 0; i < FIXED_PERIOD_DAYS; i++) {
            LocalDate d = start.plusDays(i);
            int[] c = map.getOrDefault(d, new int[2]);

            int water = c[0];
            int nutrient = c[1];

            data.add(PlantHistoryResponse.SensorAlertPoint.builder()
                    .date(d.toString())
                    .water(water)
                    .nutrient(nutrient)
                    .total(water + nutrient)
                    .build());
        }

        return PlantHistoryResponse.SensorAlertGraph.builder()
                .period(PlantHistoryResponse.Period.builder()
                        .start(start.toString())
                        .end(end.toString())
                        .build())
                .data(data)
                .build();
    }
}