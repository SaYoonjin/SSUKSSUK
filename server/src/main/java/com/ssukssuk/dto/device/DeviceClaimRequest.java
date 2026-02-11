package com.ssukssuk.dto.device;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class DeviceClaimRequest {

    @NotBlank
    private String serial;
}
