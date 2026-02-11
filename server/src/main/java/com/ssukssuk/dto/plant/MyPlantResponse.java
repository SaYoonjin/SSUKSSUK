package com.ssukssuk.dto.plant;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.ssukssuk.domain.plant.PlantStatus;
import com.ssukssuk.domain.plant.UserPlant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MyPlantResponse {

    private Long plant_id;

    private Long species_id;

    private Integer character_code;

    private String name;

    @JsonProperty("is_main")
    private boolean main;

    @JsonProperty("is_connected")
    private boolean connected;

    private Long device_id;

    public static MyPlantResponse from(UserPlant userPlant, PlantStatus plantStatus) {

        Integer characterCode = null;

        if (plantStatus != null && plantStatus.getCharactercode() != null) {
            characterCode = plantStatus.getCharactercode().getCharacterCode();
        }

        return MyPlantResponse.builder()
                .plant_id(userPlant.getPlantId())
                .species_id(userPlant.getSpecies().getSpeciesId())
                .character_code(characterCode)
                .name(userPlant.getPlantName())
                .main(Boolean.TRUE.equals(userPlant.getIsMain()))
                .connected(Boolean.TRUE.equals(userPlant.getIsConnected()))
                .device_id(userPlant.getDevice() != null ? userPlant.getDevice().getDeviceId() : null)
                .build();
    }
}
