package com.ssukssuk.repository.history;

import com.ssukssuk.domain.history.SensorEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SensorEventRepository extends JpaRepository<SensorEvent, Long> {

    /**
     * plantId + sensorCode 기준 OPEN(state=true) 이벤트 중 가장 최근 1개
     */
    Optional<SensorEvent> findTopByPlant_PlantIdAndSensorCodeAndStateOrderByStartedAtDesc(
            Long plantId,
            Integer sensorCode,
            Boolean state
    );

    default Optional<SensorEvent> findOpenByPlantIdAndSensorCode(Long plantId, Integer sensorCode) {
        return findTopByPlant_PlantIdAndSensorCodeAndStateOrderByStartedAtDesc(plantId, sensorCode, true);
    }
}