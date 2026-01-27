package com.ssukssuk.controller.test;

import com.ssukssuk.common.mqtt.dto.AckMessage;
import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.service.device.DeviceControlService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/test")
@RequiredArgsConstructor
public class TestController {

    private final DeviceControlService deviceControlService;

    @PostMapping("/mqtt/claim")
    public ApiResponse<String> publishClaim(@RequestBody ClaimReq req) {
        String msgId = deviceControlService.publishClaimUpdate(
                req.getSerial(),
                req.getUserId(),
                req.getClaimState(),
                req.getMode()
        );
        return ApiResponse.ok("published msgId=" + msgId);
    }

    @PostMapping("/mqtt/binding/bound")
    public ApiResponse<String> publishBindingBound(
            @RequestBody BindingBoundReq req
    ) {
        String msgId = deviceControlService.publishBindingUpdateBound(
                req.getSerial(),
                req.getPlantId(),
                req.getSpecies().longValue()
        );
        return ApiResponse.ok("published msgId=" + msgId);
    }

    @PostMapping("/mqtt/binding/unbound")
    public ApiResponse<String> publishBindingUnbound(
            @RequestBody BindingUnboundReq req
    ) {
        String msgId = deviceControlService.publishBindingUpdateUnbound(req.getSerial());
        return ApiResponse.ok("published msgId=" + msgId);
    }

    @PostMapping("/mqtt/mode")
    public ApiResponse<String> publishMode(@RequestBody ModeReq req) {
        String msgId = deviceControlService.publishModeUpdate(
                req.getSerial(),
                req.getPlantId(),
                req.getMode()
        );
        return ApiResponse.ok("published msgId=" + msgId);
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
