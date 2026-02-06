package com.ssukssuk.dto.plant;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NutrientCardResponse {

    private Long plantId;
    private LocalDateTime measuredAt;

    @JsonProperty("current_nutrient")
    private Float currentNutrient;

    @JsonProperty("ideal_min")
    private Float idealMin;

    @JsonProperty("ideal_max")
    private Float idealMax;

    public static NutrientCardResponse of(
            Long plantId,
            LocalDateTime measuredAt,
            Float currentNutrient,
            Float idealMin,
            Float idealMax
    ) {
        return NutrientCardResponse.builder()
                .plantId(plantId)
                .measuredAt(measuredAt)
                .currentNutrient(currentNutrient)
                .idealMin(idealMin)
                .idealMax(idealMax)
                .build();
    }
}
