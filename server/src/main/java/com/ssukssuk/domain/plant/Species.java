package com.ssukssuk.domain.plant;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Entity
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

    @Column(name = "led_start")
    private LocalDateTime ledStart;

    @Column(name = "led_end")
    private LocalDateTime ledEnd;
}
