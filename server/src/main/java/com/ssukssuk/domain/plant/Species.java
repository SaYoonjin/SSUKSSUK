package com.ssukssuk.domain.plant;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "species")
public class Species {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long speciesId;

    @Column(nullable = false)
    private String name;

    @Column(name = "temp_min")
    private Float tempMin;

    @Column(name = "temp_max")
    private Float tempMax;

    @Column(name = "hum_min")
    private Float humMin;

    @Column(name = "hum_max")
    private Float humMax;

    @Column(name = "water_min")
    private Float waterMin;

    @Column(name = "water_max")
    private Float waterMax;

    @Column(name = "ec_min")
    private Float ecMin;

    @Column(name = "ec_max")
    private Float ecMax;

    @Column(name = "led_start", nullable = false)
    private LocalTime ledStart;

    @Column(name = "led_end", nullable = false)
    private LocalTime ledEnd;

    @Builder
    public Species(String name, Float tempMin, Float tempMax, Float humMin, Float humMax,
                   Float waterMin, Float waterMax, Float ecMin, Float ecMax,
                   LocalTime ledStart, LocalTime ledEnd) {
        this.name = name;
        this.tempMin = tempMin;
        this.tempMax = tempMax;
        this.humMin = humMin;
        this.humMax = humMax;
        this.waterMin = waterMin;
        this.waterMax = waterMax;
        this.ecMin = ecMin;
        this.ecMax = ecMax;
        this.ledStart = ledStart;
        this.ledEnd = ledEnd;
    }
}
