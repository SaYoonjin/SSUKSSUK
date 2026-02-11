package com.ssukssuk.dto.admin;

import jakarta.validation.constraints.NotBlank;

public record DeviceCreateRequest(
        @NotBlank String serial
) {
}
