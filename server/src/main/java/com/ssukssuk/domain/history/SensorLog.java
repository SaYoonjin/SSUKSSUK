package com.ssukssuk.domain.history;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "sensor_log")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class SensorLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long sensorLogId;

    @Column(name = "plant_id", nullable = false)
    private Long plantId;

    @Column(name = "sensor_type_code", nullable = false)
    private Integer sensorTypeCode;

    @Column(nullable = false)
    private Float value;

    @Column(name = "measured_at", nullable = false)
    private LocalDateTime measuredAt;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;
}

