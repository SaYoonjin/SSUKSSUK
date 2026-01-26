package com.ssukssuk.controller.test;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ssukssuk.common.mqtt.dto.AckMessage;
import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.infra.mqtt.MqttPublisher;
import com.ssukssuk.service.device.DeviceControlService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/test")
@RequiredArgsConstructor
public class TestController {

    private final DeviceControlService deviceControlService;

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

    /* ===== publish-only ===== */
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
    public ApiResponse<AckMessage> publishMode(@RequestBody ModeReq req) {
        return ApiResponse.ok(
                deviceControlService.publishModeUpdate(
                        req.getSerial(),
                        req.getPlantId(),
                        req.getMode()
                )
        );
    }

    /* ===== DTO ===== */
    @Data
    public static class ClaimReq {
        private String serial;
        private Long userId;
        private String claimState;
        private String mode;
    }

    @Data
    public static class BindingBoundReq {
        private String serial;
        private Long plantId;
        private Integer species;
    }

    @Data
    public static class BindingUnboundReq {
        private String serial;
    }

    @Data
    public static class ModeReq {
        private String serial;
        private Long plantId;
        private String mode;
    }
}
