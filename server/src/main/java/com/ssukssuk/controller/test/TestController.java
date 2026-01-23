package com.ssukssuk.controller.test;

import com.ssukssuk.common.mqtt.dto.AckMessage;
import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.infra.mqtt.MqttPublisher;
import com.ssukssuk.service.device.DeviceControlService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/test")
@RequiredArgsConstructor
public class TestController {

    private final DeviceControlService deviceControlService;
    private final MqttPublisher mqttPublisher;

    @GetMapping("/me")
    public ApiResponse<String> me(Authentication authentication) {
        return ApiResponse.ok("인증 성공: " + authentication.getName());
    }

    /**
     * 1) CLAIM_UPDATE 테스트 (ACK 기다림)
     * publish topic: devices/{serial}/control/claim
     * ack topic(디바이스->서버): devices/{serial}/control/ack
     */
    @PostMapping("/mqtt/claim")
    public ApiResponse<AckMessage> publishClaim(@RequestBody ClaimReq req) {
        AckMessage ack = deviceControlService.publishClaimUpdate(
                req.getSerial(),
                req.getUserId(),
                req.getClaimState(),
                req.getMode()
        );
        return ApiResponse.ok(ack);
    }

    /**
     * 1-1 CLAIM_UPDATE 테스트 (publish-only: ACK 안 기다림)
     * publish topic: devices/{serial}/control/claim
     */
    @PostMapping("/mqtt/claim/publish-only")
    public ApiResponse<String> publishOnlyClaim(@RequestBody ClaimReq req) {
        String msgId = UUID.randomUUID().toString();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("msg_id", msgId);
        payload.put("sent_at", OffsetDateTime.now().toString());
        payload.put("serial_num", req.getSerial());
        payload.put("plant_id", null);
        payload.put("type", "CLAIM_UPDATE");
        payload.put("claim_state", req.getClaimState());
        payload.put("user_id", req.getUserId());
        payload.put("mode", req.getMode());

        mqttPublisher.publish(MqttPublisher.controlTopic(req.getSerial(), "claim"), payload);

        return ApiResponse.ok("published msgId=" + msgId);
    }

    /**
     * 2) BINDING_UPDATE 테스트 (BOUND) - ACK 기다림
     * publish topic: devices/{serial}/control/binding
     */
    @PostMapping("/mqtt/binding/bound")
    public ApiResponse<AckMessage> publishBindingBound(@RequestBody BindingBoundReq req) {
        AckMessage ack = deviceControlService.publishBindingUpdateBound(
                req.getSerial(),
                req.getPlantId(),
                req.getSpecies(),
                req.getWlMin(),
                req.getWlMax(),
                req.getEcMin(),
                req.getEcMax()
        );
        return ApiResponse.ok(ack);
    }

    /**
     * 3) BINDING_UPDATE 테스트 (UNBOUND) - ACK 기다림
     * publish topic: devices/{serial}/control/binding
     */
    @PostMapping("/mqtt/binding/unbound")
    public ApiResponse<AckMessage> publishBindingUnbound(@RequestBody BindingUnboundReq req) {
        AckMessage ack = deviceControlService.publishBindingUpdateUnbound(req.getSerial());
        return ApiResponse.ok(ack);
    }

    /**
     * 4) MODE_UPDATE 테스트 - ACK 기다림
     * publish topic: devices/{serial}/control/mode
     */
    @PostMapping("/mqtt/mode")
    public ApiResponse<AckMessage> publishMode(@RequestBody ModeReq req) {
        AckMessage ack = deviceControlService.publishModeUpdate(
                req.getSerial(),
                req.getPlantId(),
                req.getMode()
        );
        return ApiResponse.ok(ack);
    }

    // ===== Request DTOs =====

    @Data
    public static class ClaimReq {
        private String serial;
        private Long userId;
        private String claimState; // "CLAIMED" / "UNCLAIMED" 등
        private String mode;       // "AUTO" / "MANUAL"
    }

    @Data
    public static class BindingBoundReq {
        private String serial;
        private Long plantId;
        private Integer species;
        private Double wlMin;
        private Double wlMax;
        private Double ecMin;
        private Double ecMax;
    }

    @Data
    public static class BindingUnboundReq {
        private String serial;
    }

    @Data
    public static class ModeReq {
        private String serial;
        private Long plantId;
        private String mode; // "AUTO" / "MANUAL"
    }
}