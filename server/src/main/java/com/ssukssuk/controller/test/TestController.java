package com.ssukssuk.controller.test;

import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.service.device.DeviceControlService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {

    private final DeviceControlService deviceControlService;

    @PostMapping("/mqtt/claim")
    public ApiResponse<String> publishClaim(@RequestBody ClaimReq req) {
        deviceControlService.sendClaimUpdate(
                req.getSerial(),
                req.getUserId(),
                req.getClaimState(),
                req.getMode()
        );
        return ApiResponse.ok("ACK received");
    }

    @PostMapping("/mqtt/binding/bound")
    public ApiResponse<String> publishBindingBound(
            @RequestBody BindingBoundReq req
    ) {
        deviceControlService.sendBindingBound(
                req.getSerial(),
                req.getPlantId(),
                req.getSpecies().longValue()
        );
        return ApiResponse.ok("ACK received");
    }

    @PostMapping("/mqtt/binding/unbound")
    public ApiResponse<String> publishBindingUnbound(
            @RequestBody BindingUnboundReq req
    ) {
        deviceControlService.sendBindingUnbound(req.getSerial());
        return ApiResponse.ok("ACK received");
    }

    @PostMapping("/mqtt/mode")
    public ApiResponse<String> publishMode(@RequestBody ModeReq req) {
        deviceControlService.sendModeUpdate(
                req.getSerial(),
                req.getPlantId(),
                req.getMode()
        );
        return ApiResponse.ok("ACK received");
    }

    @Data
    public static class ClaimReq {
        private String serial;
        private Long userId;
        private String claimState; // CLAIMED / UNCLAIMED
        private String mode;       // AUTO / MANUAL
    }

    @Data
    public static class BindingBoundReq {
        private String serial;
        private Long plantId;
        private Integer species; // speciesId
    }

    @Data
    public static class BindingUnboundReq {
        private String serial;
    }

    @Data
    public static class ModeReq {
        private String serial;
        private Long plantId;
        private String mode; // AUTO / MANUAL
    }
}
