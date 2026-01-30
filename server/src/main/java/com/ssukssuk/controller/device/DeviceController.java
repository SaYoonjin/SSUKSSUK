package com.ssukssuk.controller.device;

import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.dto.device.DeviceClaimRequest;
import com.ssukssuk.dto.device.DeviceClaimResponse;
import com.ssukssuk.dto.device.DeviceResponse;
import com.ssukssuk.service.device.DeviceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/devices")
public class DeviceController {

    private final DeviceService deviceService;

    @GetMapping
    public ApiResponse<List<DeviceResponse>> getMyDevices(
            @AuthenticationPrincipal Long userId
    ) {
        return ApiResponse.ok(deviceService.getMyDevices(userId));
    }

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