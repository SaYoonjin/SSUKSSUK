package com.ssukssuk.service.device;

import com.ssukssuk.common.mqtt.dto.AckMessage;
import com.ssukssuk.infra.mqtt.MqttPublisher;
import com.ssukssuk.infra.mqtt.ack.PendingAckStore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

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
        m.put("plant_id", plantId);
        m.put("type", type);
        return m;
    }

    private AckMessage publishAndWait(
            String serial,
            String channel,
            String msgId,
            Map<String, Object> payload
    ) {
        CompletableFuture<AckMessage> future =
                pendingAckStore.register(serial, msgId, DEFAULT_ACK_TIMEOUT);

        mqttPublisher.publish(
                MqttPublisher.controlTopic(serial, channel),
                payload
        );

        try {
            return future.get();
        } catch (Exception e) {
            throw new RuntimeException("ACK wait failed", e);
        }
    }

    public AckMessage publishClaimUpdate(
            String serial,
            Long userId,
            String claimState,
            String mode
    ) {
        String msgId = UUID.randomUUID().toString();

        Map<String, Object> payload = base(msgId, serial, null, "CLAIM_UPDATE");
        payload.put("claim_state", claimState);
        payload.put("user_id", userId);
        payload.put("mode", mode);

        return publishAndWait(serial, "claim", msgId, payload);
    }

    public AckMessage publishModeUpdate(
            String serial,
            Long plantId,
            String mode
    ) {
        String msgId = UUID.randomUUID().toString();

        Map<String, Object> payload = base(msgId, serial, plantId, "MODE_UPDATE");
        payload.put("mode", mode);
        payload.put("effective_from", OffsetDateTime.now().toString());

        return publishAndWait(serial, "mode", msgId, payload);
    }

    public AckMessage publishBindingUpdateBound(
            String serial,
            Long plantId,
            Integer species,
            Double tempMin, Double tempMax,
            Double humMin, Double humMax,
            Double wlMin, Double wlMax,
            Double ecMin, Double ecMax,
            LocalDateTime ledStart,
            LocalDateTime ledEnd
    ) {
        String msgId = UUID.randomUUID().toString();

        Map<String, Object> payload = base(msgId, serial, plantId, "BINDING_UPDATE");
        payload.put("binding_state", "BOUND");
        payload.put("species", species);

        payload.put("led_time", Map.of(
                "start", ledStart.getHour(),
                "end", ledEnd.getHour()
        ));

        Map<String, Object> idealRanges = new LinkedHashMap<>();
        idealRanges.put("temperature", Map.of("min", tempMin, "max", tempMax));
        idealRanges.put("humidity", Map.of("min", humMin, "max", humMax));
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
        payload.put("led_time", null);
        payload.put("ideal_ranges", null);

        return publishAndWait(serial, "binding", msgId, payload);
    }
}
