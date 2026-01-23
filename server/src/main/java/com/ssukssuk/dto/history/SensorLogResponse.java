package com.ssukssuk.dto.history;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SensorLogResponse {

    private Integer sensorTypeCode;
    private Float value;
    private LocalDateTime measuredAt;
}

