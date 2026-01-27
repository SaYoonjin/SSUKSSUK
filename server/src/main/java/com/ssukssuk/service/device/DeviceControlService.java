package com.ssukssuk.service.device;

import com.ssukssuk.domain.plant.Species;
import com.ssukssuk.infra.mqtt.MqttPublisher;
import com.ssukssuk.repository.plant.SpeciesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeviceControlService {

    private final MqttPublisher mqttPublisher;
    private final SpeciesRepository speciesRepository;

    private Map<String, Object> base(
            String msgId,
            String serial,
            Long plantId,
            String type
    ) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("msg_id", msgId);
        m.put("sent_at", OffsetDateTime.now().toString());
        m.put("serial_num", serial);
        m.put("plant_id", plantId);
        m.put("type", type);
        return m;
    }

    /* ===== CLAIM_UPDATE (publish-only) ===== */
    public String publishClaimUpdate(
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

        mqttPublisher.publish(
                MqttPublisher.controlTopic(serial, "claim"),
                payload
        );

        return msgId;
    }

    /* ===== MODE_UPDATE (publish-only) ===== */
    public String publishModeUpdate(
            String serial,
            Long plantId,
            String mode
    ) {
        String msgId = UUID.randomUUID().toString();

        Map<String, Object> payload = base(msgId, serial, plantId, "MODE_UPDATE");
        payload.put("mode", mode);
        payload.put("effective_from", OffsetDateTime.now().toString());

        mqttPublisher.publish(
                MqttPublisher.controlTopic(serial, "mode"),
                payload
        );

        return msgId;
    }

    /* ===== BINDING_UPDATE : BOUND ===== */
    public String publishBindingUpdateBound(
            String serial,
            Long plantId,
            Long speciesId
    ) {
        Species species = speciesRepository.findById(speciesId)
                .orElseThrow(() ->
                        new RuntimeException("Species not found: " + speciesId)
                );

        String msgId = UUID.randomUUID().toString();

        Map<String, Object> payload = base(msgId, serial, plantId, "BINDING_UPDATE");
        payload.put("binding_state", "BOUND");
        payload.put("species", speciesId);

        payload.put("led_time", Map.of(
                "start", species.getLedStart().getHour(),
                "end", species.getLedEnd().getHour()
        ));

        payload.put("ideal_ranges", Map.of(
                "temperature", Map.of(
                        "min", species.getTempMin(),
                        "max", species.getTempMax()
                ),
                "humidity", Map.of(
                        "min", species.getHumMin(),
                        "max", species.getHumMax()
                ),
                "water_level", Map.of(
                        "min", species.getWaterMin(),
                        "max", species.getWaterMax()
                ),
                "nutrient_conc", Map.of(
                        "min", species.getEcMin(),
                        "max", species.getEcMax()
                )
        ));

        mqttPublisher.publish(
                MqttPublisher.controlTopic(serial, "binding"),
                payload
        );

        return msgId;
    }

    /* ===== BINDING_UPDATE : UNBOUND ===== */
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
