package com.ssukssuk.dto.plant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class CreatePlantRequest {

    @NotBlank
    private String name;

    @NotNull
    private Long species;

    @NotNull
    private Long deviceId;

    @NotNull
    private Boolean isMain;
}