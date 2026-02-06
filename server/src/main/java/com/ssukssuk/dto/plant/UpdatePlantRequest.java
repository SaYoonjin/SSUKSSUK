package com.ssukssuk.dto.plant;

import lombok.Getter;

@Getter
public class UpdatePlantRequest {

    private String name;     // 변경할 닉네임
    private Long deviceId;   // 디바이스 ID (null이면 연결 해제, 값이 있으면 해당 디바이스로 연결)
}
