package com.ssukssuk.controller.device;

import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.dto.device.DeviceClaimRequest;
import com.ssukssuk.dto.device.DeviceClaimResponse;
import com.ssukssuk.service.device.DeviceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/devices")
public class DeviceController {

    private final DeviceService deviceService;

    @PostMapping("/claim")
    public ApiResponse<DeviceClaimResponse> claimDevice(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody DeviceClaimRequest request
    ) {
        return ApiResponse.ok(
                deviceService.claim(userId, request.getSerial())
        );
    }

    @DeleteMapping("/{deviceId}")
    public ApiResponse<Void> unclaimDevice(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long deviceId
    ) {
        deviceService.unclaim(userId, deviceId);
        return ApiResponse.ok();
    }
}
