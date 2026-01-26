package com.ssukssuk.service.device;

import com.ssukssuk.common.mqtt.dto.AckMessage;
import com.ssukssuk.domain.plant.Species;
import com.ssukssuk.infra.mqtt.MqttPublisher;
import com.ssukssuk.infra.mqtt.ack.PendingAckStore;
import com.ssukssuk.repository.plant.SpeciesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class DeviceControlService {

    private final MqttPublisher mqttPublisher;
    private final PendingAckStore pendingAckStore;
    private final SpeciesRepository speciesRepository;

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

    /* ===== ACK 필요한 경우 ===== */
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
            return future.get(DEFAULT_ACK_TIMEOUT.toMillis(), TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            throw new RuntimeException(
                    "ACK wait failed (serial=" + serial + ", msgId=" + msgId + ")", e
            );
        }
    }

    /* ===== CLAIM_UPDATE ===== */
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

    /* ===== MODE_UPDATE ===== */
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

    /* ===== BINDING_UPDATE (publish-only) ===== */
    public String publishBindingUpdateBound(
            String serial,
            Long plantId,
            Long speciesId
    ) {
        Species species = speciesRepository.findById(speciesId)
                .orElseThrow(() -> new RuntimeException("Species not found: " + speciesId));

        String msgId = UUID.randomUUID().toString();

        Map<String, Object> payload = base(msgId, serial, plantId, "BINDING_UPDATE");
        payload.put("binding_state", "BOUND");
        payload.put("species", speciesId);

        payload.put("led_time", Map.of(
                "start", species.getLedStart().getHour(),
                "end", species.getLedEnd().getHour()
        ));

        payload.put("ideal_ranges", Map.of(
                "temperature", Map.of("min", species.getTempMin(), "max", species.getTempMax()),
                "humidity", Map.of("min", species.getHumMin(), "max", species.getHumMax()),
                "water_level", Map.of("min", species.getWaterMin(), "max", species.getWaterMax()),
                "nutrient_conc", Map.of("min", species.getEcMin(), "max", species.getEcMax())
        ));

        mqttPublisher.publish(
                MqttPublisher.controlTopic(serial, "binding"),
                payload
        );

        return msgId;
    }

    public String publishBindingUpdateUnbound(String serial) {
        String msgId = UUID.randomUUID().toString();

        Map<String, Object> payload = base(msgId, serial, null, "BINDING_UPDATE");
        payload.put("binding_state", "UNBOUND");
        payload.put("species", null);
        payload.put("led_time", null);
        payload.put("ideal_ranges", null);

        mqttPublisher.publish(
                MqttPublisher.controlTopic(serial, "binding"),
                payload
        );

        return msgId;
    }
}
