package com.ssukssuk.domain.history;

import com.ssukssuk.domain.plant.UserPlant;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "sensor_event")
public class SensorEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long eventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id", nullable = false)
    private UserPlant plant;

    private Integer sensorCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "first_sensor_log_id")
    private SensorLog firstSensorLog;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_sensor_log_id")
    private SensorLog lastSensorLog;

    /**
     * true = OPEN, false = RESOLVED
     */
    private Boolean state;

    private LocalDateTime startedAt;

    private LocalDateTime resolvedAt;

    /* ========================
       Factory / Domain Methods
       ======================== */

    public static SensorEvent open(
            UserPlant plant,
            Integer sensorCode,
            SensorLog firstSensorLog,
            LocalDateTime startedAt
    ) {
        SensorEvent e = new SensorEvent();
        e.plant = plant;
        e.sensorCode = sensorCode;
        e.firstSensorLog = firstSensorLog;
        e.lastSensorLog = firstSensorLog;
        e.state = true;
        e.startedAt = startedAt;
        return e;
    }

    public void updateLast(SensorLog lastSensorLog) {
        this.lastSensorLog = lastSensorLog;
    }

    public void resolve(SensorLog lastSensorLog, LocalDateTime resolvedAt) {
        this.lastSensorLog = lastSensorLog;
        this.state = false;
        this.resolvedAt = resolvedAt;
    }
}