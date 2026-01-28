package com.ssukssuk.domain.history;

import com.ssukssuk.domain.plant.UserPlant;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id", nullable = false)
    private UserPlant plant;

    @Column(name = "measured_at", nullable = false)
    private LocalDateTime measuredAt;

    private Float temperature;

    private Float humidity;

    private Float waterLevel;

    private Float nutrientConc;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;
}
