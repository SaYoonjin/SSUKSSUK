package com.ssukssuk.dto.device;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DeviceResponse {

    private Long deviceId;
    private String serial;
    private boolean paired;           // 사용자와 페어링됨
    private boolean plantConnected;   // 식물과 연결됨
    private Long connectedPlantId;    // 연결된 식물 ID (있으면)
    private String connectedPlantName; // 연결된 식물 이름 (있으면)
}