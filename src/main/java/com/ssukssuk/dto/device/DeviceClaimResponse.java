package com.ssukssuk.dto.device;

import com.ssukssuk.domain.device.Device;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class DeviceClaimResponse {

    private Long deviceId;
    private String serial;
    private Boolean pairing;
    private LocalDateTime claimedAt;

    public static DeviceClaimResponse from(Device device) {
        return DeviceClaimResponse.builder()
                .deviceId(device.getDeviceId())
                .serial(device.getSerial())
                .pairing(device.getPairing())
                .claimedAt(device.getClaimedAt())
                .build();
    }
}
