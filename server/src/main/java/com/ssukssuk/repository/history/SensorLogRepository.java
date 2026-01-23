package com.ssukssuk.repository.history;

import com.ssukssuk.domain.history.SensorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SensorLogRepository extends JpaRepository<SensorLog, Long> {

    // 최신 1건 조회
    Optional<SensorLog> findTopByPlantIdAndSensorTypeCodeOrderByMeasuredAtDesc(
            Long plantId,
            Integer sensorTypeCode
    );

    // 특정 식물의 전체 센서 로그
    List<SensorLog> findByPlantIdOrderByMeasuredAtDesc(Long plantId);
}
