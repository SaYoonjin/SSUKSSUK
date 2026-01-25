package com.ssukssuk.service.device;

import com.ssukssuk.common.mqtt.dto.AckMessage;
import com.ssukssuk.infra.mqtt.MqttPublisher;
import com.ssukssuk.infra.mqtt.ack.PendingAckStore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
public class DeviceControlService {

    private final MqttPublisher mqttPublisher;
    private final PendingAckStore pendingAckStore;

    private static final Duration DEFAULT_ACK_TIMEOUT = Duration.ofSeconds(3);

    private Map<String, Object> base(String msgId, String serial, Long plantId, String type) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("msg_id", msgId);
        m.put("sent_at", OffsetDateTime.now().toString());
        m.put("serial_num", serial);
        m.put("plant_id", plantId); // claim이면 null 가능
        m.put("type", type);
        return m;
    }

    private AckMessage publishAndWait(String serial, String channel, String msgId, Map<String, Object> payload) {
        CompletableFuture<AckMessage> future =
                pendingAckStore.register(serial, msgId, DEFAULT_ACK_TIMEOUT);

        try {
            mqttPublisher.publish(MqttPublisher.controlTopic(serial, channel), payload);
        } catch (Exception e) {
            future.completeExceptionally(e);
            throw new RuntimeException("MQTT publish failed: " + e.getMessage(), e);
        }

        try {
            return future.get();
        } catch (ExecutionException ee) {
            Throwable cause = ee.getCause();
            if (cause instanceof RuntimeException re) throw re;
            throw new RuntimeException("ACK wait failed: " + cause.getMessage(), cause);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("ACK wait interrupted", ie);
        }
    }

    public AckMessage publishClaimUpdate(String serial, Long userId, String claimState, String mode) {
        String msgId = UUID.randomUUID().toString();

        Map<String, Object> payload = base(msgId, serial, null, "CLAIM_UPDATE");
        payload.put("claim_state", claimState); // "CLAIMED" 등
        payload.put("user_id", userId);         // 문서상 optional이지만 있으면 좋음
        payload.put("mode", mode);              // "AUTO" / "MANUAL"

        return publishAndWait(serial, "claim", msgId, payload);
    }

    public AckMessage publishBindingUpdateBound(String serial, Long plantId, Integer species,
                                                Double wlMin, Double wlMax, Double ecMin, Double ecMax) {
        String msgId = UUID.randomUUID().toString();

        Map<String, Object> payload = base(msgId, serial, plantId, "BINDING_UPDATE");
        payload.put("binding_state", "BOUND");
        payload.put("species", species);

        Map<String, Object> idealRanges = new LinkedHashMap<>();
        idealRanges.put("water_level", Map.of("min", wlMin, "max", wlMax));
        idealRanges.put("nutrient_conc", Map.of("min", ecMin, "max", ecMax));
        payload.put("ideal_ranges", idealRanges);

        return publishAndWait(serial, "binding", msgId, payload);
    }

    public AckMessage publishBindingUpdateUnbound(String serial) {
        String msgId = UUID.randomUUID().toString();

        Map<String, Object> payload = base(msgId, serial, null, "BINDING_UPDATE");
        payload.put("binding_state", "UNBOUND");
        payload.put("species", null);
        payload.put("ideal_ranges", null);

        return publishAndWait(serial, "binding", msgId, payload);
    }

    public AckMessage publishModeUpdate(String serial, Long plantId, String mode) {
        String msgId = UUID.randomUUID().toString();

        Map<String, Object> payload = base(msgId, serial, plantId, "MODE_UPDATE");
        payload.put("mode", mode);
        payload.put("effective_from", OffsetDateTime.now().toString());

        return publishAndWait(serial, "mode", msgId, payload);
    }
}