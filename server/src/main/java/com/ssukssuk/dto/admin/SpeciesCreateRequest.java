package com.ssukssuk.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record SpeciesCreateRequest(
        @NotBlank String name,
        Float tempMin,
        Float tempMax,
        Float humMin,
        Float humMax,
        Float waterMin,
        Float waterMax,
        Float ecMin,
        Float ecMax,
        @NotNull LocalTime ledStart,
        @NotNull LocalTime ledEnd
) {
}
