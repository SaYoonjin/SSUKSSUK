package com.ssukssuk.dto.plant;

import com.ssukssuk.domain.plant.Species;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SpeciesResponse {

    private Long speciesId;
    private String name;

    public static SpeciesResponse from(Species species) {
        return SpeciesResponse.builder()
                .speciesId(species.getSpeciesId())
                .name(species.getName())
                .build();
    }
}
