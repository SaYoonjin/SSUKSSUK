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

    /**
     * CLAIM_UPDATE 테스트 (ACK)
     */
    @PostMapping("/mqtt/claim")
    public ApiResponse<AckMessage> publishClaim(@RequestBody ClaimReq req) {
        return ApiResponse.ok(
                deviceControlService.publishClaimUpdate(
                        req.getSerial(),
                        req.getUserId(),
                        req.getClaimState(),
                        req.getMode()
                )
        );
    }

    /**
     * BINDING_UPDATE (BOUND) - publish-only
     */
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

    /**
     * BINDING_UPDATE (UNBOUND) - publish-only
     */
    @PostMapping("/mqtt/binding/unbound")
    public ApiResponse<String> publishBindingUnbound(
            @RequestBody BindingUnboundReq req
    ) {
        String msgId = deviceControlService.publishBindingUpdateUnbound(req.getSerial());
        return ApiResponse.ok("published msgId=" + msgId);
    }

    /**
     * MODE_UPDATE (ACK)
     */
    @PostMapping("/mqtt/mode")
    public ApiResponse<AckMessage> publishMode(@RequestBody ModeReq req) {
        return ApiResponse.ok(
                deviceControlService.publishModeUpdate(
                        req.getSerial(),
                        req.getPlantId(),
                        req.getMode()
                )
        );
    }

    // ===== DTOs =====

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
