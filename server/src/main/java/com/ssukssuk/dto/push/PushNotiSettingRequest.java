package com.ssukssuk.dto.push;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class PushNotiSettingRequest {

    @NotNull
    private Boolean notiSetting;

    @NotNull
    private String mobileDeviceId;
}
