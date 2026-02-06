package com.ssukssuk.dto.plant;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Builder;
import lombok.Getter;

@Getter
public class CreatePlantResponse {

    private Long plantId;
    private String name;
    private Long species;
    private Long deviceId;
    private Integer characterCode;

    @JsonIgnore
    private String bindingError;

    @Builder
    private CreatePlantResponse(Long plantId,
                                String name,
                                Long species,
                                Long deviceId,
                                Integer characterCode,
                                String bindingError) {
        this.plantId = plantId;
        this.name = name;
        this.species = species;
        this.deviceId = deviceId;
        this.characterCode = characterCode;
        this.bindingError = bindingError;
    }

    public boolean hasBindingError() {
        return bindingError != null;
    }
}