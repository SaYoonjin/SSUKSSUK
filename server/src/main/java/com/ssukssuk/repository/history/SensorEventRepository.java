package com.ssukssuk.repository.history;

import com.ssukssuk.domain.history.SensorEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SensorEventRepository extends JpaRepository<SensorEvent, Long> {

    /**
     * plantId + sensorCode 기준 OPEN(state=true) 이벤트 중 가장 최근 1개
     */
    @Query("""
    select e
    from SensorEvent e
    where e.plant.plantId = :plantId
      and e.sensorCode = :sensorCode
      and e.state = :state
    order by e.startedAt desc
""")
    Optional<SensorEvent> findLatestByPlantIdAndSensorCodeAndState(
            @Param("plantId") Long plantId,
            @Param("sensorCode") Integer sensorCode,
            @Param("state") Boolean state
    );

    default Optional<SensorEvent> findOpenByPlantIdAndSensorCode(Long plantId, Integer sensorCode) {
        return findLatestByPlantIdAndSensorCodeAndState(
                plantId, sensorCode, true
        );
    }

    // 히스토리 그래프용: 기간 내 이벤트 전체 조회
    @Query("""
        select e
        from SensorEvent e
        where e.plant.plantId = :plantId
          and e.startedAt >= :start
          and e.startedAt <  :endExclusive
    """)
    List<SensorEvent> findByPlantIdAndStartedAtBetween(
            @Param("plantId") Long plantId,
            @Param("start") LocalDateTime start,
            @Param("endExclusive") LocalDateTime endExclusive
    );
}
