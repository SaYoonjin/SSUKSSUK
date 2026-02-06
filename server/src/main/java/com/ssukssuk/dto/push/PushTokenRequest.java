package com.ssukssuk.dto.push;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PushTokenRequest {

    @NotBlank
    private String token;

    @NotBlank
    private String platform;   // ANDROID

    @NotBlank
    private String mobileDeviceId;
}
