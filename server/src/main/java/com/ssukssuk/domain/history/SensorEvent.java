package com.ssukssuk.domain.history;

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

    private Long plantId;

    private Integer sensorCode;

    private Long firstSensorLogId;

    private Long lastSensorLogId;

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
            Long plantId,
            Integer sensorCode,
            Long firstSensorLogId,
            LocalDateTime startedAt
    ) {
        SensorEvent e = new SensorEvent();
        e.plantId = plantId;
        e.sensorCode = sensorCode;
        e.firstSensorLogId = firstSensorLogId;
        e.lastSensorLogId = firstSensorLogId;
        e.state = true;
        e.startedAt = startedAt;
        return e;
    }

    public void updateLast(Long lastSensorLogId) {
        this.lastSensorLogId = lastSensorLogId;
    }

    public void resolve(Long lastSensorLogId, LocalDateTime resolvedAt) {
        this.lastSensorLogId = lastSensorLogId;
        this.state = false;
        this.resolvedAt = resolvedAt;
    }
}