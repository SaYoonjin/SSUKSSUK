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

    private Long deviceId;  // nullable - 기기 연결 없이 식물 등록 가능
}