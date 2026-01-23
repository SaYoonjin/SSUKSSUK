package com.ssukssuk.controller.device;

import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.dto.device.DeviceClaimRequest;
import com.ssukssuk.dto.device.DeviceClaimResponse;
import com.ssukssuk.service.device.DeviceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/devices")
public class DeviceController {

    private final DeviceService deviceService;

    /**
     * 디바이스 클레임 (연결)
     */
    @PostMapping("/claim")
    public ApiResponse<DeviceClaimResponse> claimDevice(
            Authentication authentication,
            @RequestBody @Valid DeviceClaimRequest request
    ) {
        // JwtAuthenticationFilter 에서 principal = userId
        Long userId = (Long) authentication.getPrincipal();

        return ApiResponse.ok(
                deviceService.claim(userId, request.getSerial())
        );
    }
}
