package com.ssukssuk.dto.plant;

import lombok.Getter;

@Getter
public class UpdatePlantRequest {

    private String name;      // 변경할 닉네임 (null이면 변경 안함)
    private Long deviceId;    // 변경할 디바이스 ID (null이면 연결 해제)
    private Boolean unbindDevice; // true이면 디바이스 연결 해제
}