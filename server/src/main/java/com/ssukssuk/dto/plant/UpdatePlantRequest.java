package com.ssukssuk.dto.plant;

import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.Getter;

@Getter
public class UpdatePlantRequest {

    private String name;              // 변경할 닉네임 (키 없으면 변경 안함)
    private Long deviceId;            // 디바이스 ID
    private boolean deviceIdProvided; // JSON에 deviceId 키가 있었는지 여부

    @JsonSetter("deviceId")
    public void setDeviceId(Long deviceId) {
        this.deviceId = deviceId;
        this.deviceIdProvided = true;
    }
    // deviceId 키가 없으면: deviceIdProvided=false → 디바이스 변경 안 함
    // deviceId: null이면:   deviceIdProvided=true, deviceId=null → 연결 해제
    // deviceId: 11이면:     deviceIdProvided=true, deviceId=11 → 해당 디바이스로 연결
}