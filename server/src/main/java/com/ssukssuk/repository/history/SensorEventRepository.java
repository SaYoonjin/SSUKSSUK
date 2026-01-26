package com.ssukssuk.repository.history;

import com.ssukssuk.domain.history.SensorEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface SensorEventRepository extends JpaRepository<SensorEvent, Long> {

    @Query("""
        select e
        from SensorEvent e
        where e.plantId = :plantId
          and e.sensorCode = :sensorCode
          and e.state = true
    """)
    Optional<SensorEvent> findOpenByPlantIdAndSensorCode(
            Long plantId,
            Integer sensorCode
    );
}