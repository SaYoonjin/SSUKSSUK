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
    private final MqttPublisher mqttPublisher;

    @GetMapping("/me")
    public ApiResponse<String> me(Authentication authentication) {
        return ApiResponse.ok("인증 성공: " + authentication.getName());
    }

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

    @PostMapping("/mqtt/binding/bound/publish-only")
    public ApiResponse<String> publishBindingBoundOnly(
            @RequestBody BindingBoundReq req
    ) {
        String msgId = UUID.randomUUID().toString();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("msg_id", msgId);
        payload.put("sent_at", OffsetDateTime.now().toString());
        payload.put("serial_num", req.getSerial());
        payload.put("plant_id", req.getPlantId());
        payload.put("type", "BINDING_UPDATE");
        payload.put("binding_state", "BOUND");
        payload.put("species", req.getSpecies());

        payload.put("led_time", Map.of(
                "start", req.getLedStart().getHour(),
                "end", req.getLedEnd().getHour()
        ));

        mqttPublisher.publish(
                MqttPublisher.controlTopic(req.getSerial(), "binding"),
                payload
        );

        return ApiResponse.ok("published msgId=" + msgId);
    }


    @PostMapping("/mqtt/binding/bound")
    public ApiResponse<AckMessage> publishBindingBound(@RequestBody BindingBoundReq req) {
        AckMessage ack = deviceControlService.publishBindingUpdateBound(
                req.getSerial(),
                req.getPlantId(),
                req.getSpecies(),

                req.getTempMin(), req.getTempMax(),
                req.getHumMin(), req.getHumMax(),
                req.getWlMin(), req.getWlMax(),
                req.getEcMin(), req.getEcMax(),

                req.getLedStart(),
                req.getLedEnd()
        );
        return ApiResponse.ok(ack);
    }

    @PostMapping("/mqtt/binding/unbound")
    public ApiResponse<AckMessage> publishBindingUnbound(@RequestBody BindingUnboundReq req) {
        AckMessage ack = deviceControlService.publishBindingUpdateUnbound(req.getSerial());
        return ApiResponse.ok(ack);
    }

    @PostMapping("/mqtt/mode")
    public ApiResponse<AckMessage> publishMode(@RequestBody ModeReq req) {
        AckMessage ack = deviceControlService.publishModeUpdate(
                req.getSerial(),
                req.getPlantId(),
                req.getMode()
        );
        return ApiResponse.ok(ack);
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
        private Integer species;

        private Double tempMin;
        private Double tempMax;
        private Double humMin;
        private Double humMax;
        private Double wlMin;
        private Double wlMax;
        private Double ecMin;
        private Double ecMax;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime ledStart;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime ledEnd;
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
