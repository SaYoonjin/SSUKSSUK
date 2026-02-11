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

    // status 필드들 (OK, UP, DOWN)
    @Enumerated(EnumType.STRING)
    @Column(name = "temperature_status", length = 10)
    private SensorStatus temperatureStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "humidity_status", length = 10)
    private SensorStatus humidityStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "water_level_status", length = 10)
    private SensorStatus waterLevelStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "nutrient_conc_status", length = 10)
    private SensorStatus nutrientConcStatus;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    public enum SensorStatus {
        OK, UP, DOWN
    }
}
