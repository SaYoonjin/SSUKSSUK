package com.ssukssuk.dto.plant;

import lombok.Builder;
import lombok.Getter;

@Getter
public class CreatePlantResponse {

    private Long plantId;
    private String name;
    private Long species;
    private Long deviceId;
    private Integer characterCode;

    @Builder
    private CreatePlantResponse(Long plantId,
                                String name,
                                Long species,
                                Long deviceId,
                                Integer characterCode) {
        this.plantId = plantId;
        this.name = name;
        this.species = species;
        this.deviceId = deviceId;
        this.characterCode = characterCode;
    }
}