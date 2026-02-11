package com.ssukssuk.dto.plant;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class WaterCardResponse {

    private Long plantId;
    private LocalDateTime measuredAt;

    @JsonProperty("current_water")
    private Float currentWater;

    @JsonProperty("ideal_min")
    private Float idealMin;

    @JsonProperty("ideal_max")
    private Float idealMax;

    public static WaterCardResponse of(
            Long plantId,
            LocalDateTime measuredAt,
            Float currentWater,
            Float idealMin,
            Float idealMax
    ) {
        return WaterCardResponse.builder()
                .plantId(plantId)
                .measuredAt(measuredAt)
                .currentWater(currentWater)
                .idealMin(idealMin)
                .idealMax(idealMax)
                .build();
    }
}
