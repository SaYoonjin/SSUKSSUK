package com.ssukssuk.repository.history;

import com.ssukssuk.domain.history.SensorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SensorLogRepository extends JpaRepository<SensorLog, Long> {

    Optional<SensorLog> findTopByPlant_PlantIdOrderByMeasuredAtDesc(Long plantId);

    // 특정 식물의 전체 센서 로그
    List<SensorLog> findByPlant_PlantIdOrderByMeasuredAtDesc(Long plantId);
}
