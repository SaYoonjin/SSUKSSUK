package com.ssukssuk.dto.history;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorLogRequest {

    private Long plantId;
    private Integer sensorTypeCode;
    private Float value;
    private LocalDateTime measuredAt;
}


