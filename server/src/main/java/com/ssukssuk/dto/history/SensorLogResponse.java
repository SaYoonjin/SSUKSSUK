package com.ssukssuk.dto.history;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SensorLogResponse {

    private LocalDateTime measuredAt;

    private Float temperature;
    private Float humidity;
    private Float waterLevel;
    private Float nutrientConc;
}
