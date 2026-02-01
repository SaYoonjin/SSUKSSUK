package com.ssukssuk.service.device;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.plant.Species;
import com.ssukssuk.infra.mqtt.MqttPublisher;
import com.ssukssuk.infra.mqtt.ack.PendingAckStore;
import com.ssukssuk.infra.mqtt.dto.AckMessage;
import com.ssukssuk.repository.plant.SpeciesRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceControlService {

    private static final Duration ACK_TIMEOUT = Duration.ofSeconds(15);

    private final MqttPublisher mqttPublisher;
    private final PendingAckStore pendingAckStore;
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

    /**
     * MQTT 발송 후 ACK 대기
     * @return AckMessage (성공 시)
     * @throws CustomException ACK 실패 또는 타임아웃 시
     */
    private AckMessage publishAndWaitAck(String serial, String msgId, String topic, Map<String, Object> payload) {
        // 1. ACK 대기 등록
        CompletableFuture<AckMessage> future = pendingAckStore.register(serial, msgId, ACK_TIMEOUT);

        // 2. MQTT 발송
        mqttPublisher.publish(topic, payload);

        // 3. ACK 대기
        try {
            AckMessage ack = future.get(ACK_TIMEOUT.toMillis(), TimeUnit.MILLISECONDS);

            // 4. ACK 상태 확인
            if (ack.getStatus() != AckMessage.AckStatus.OK) {
                log.error("[MQTT][ACK] Device returned error. serial={}, status={}, errorCode={}",
                        serial, ack.getStatus(), ack.getError_code());
                throw new CustomException(ErrorCode.DEVICE_ACK_FAILED);
            }

            log.info("[MQTT][ACK] Success. serial={}, msgId={}", serial, msgId);
            return ack;

        } catch (java.util.concurrent.TimeoutException e) {
            log.error("[MQTT][ACK] Timeout. serial={}, msgId={}", serial, msgId);
            throw new CustomException(ErrorCode.DEVICE_ACK_TIMEOUT);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("[MQTT][ACK] Unexpected error. serial={}, msgId={}", serial, msgId, e);
            throw new CustomException(ErrorCode.DEVICE_ACK_FAILED);
        }
    }

    /* ===== CLAIM_UPDATE ===== */
    public void sendClaimUpdate(
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

        publishAndWaitAck(serial, msgId, MqttPublisher.controlTopic(serial, "claim"), payload);
    }

    /* ===== MODE_UPDATE ===== */
    public void sendModeUpdate(
            String serial,
            Long plantId,
            String mode
    ) {
        String msgId = UUID.randomUUID().toString();

        Map<String, Object> payload = base(msgId, serial, plantId, "MODE_UPDATE");
        payload.put("mode", mode);
        payload.put("effective_from", OffsetDateTime.now().toString());

        publishAndWaitAck(serial, msgId, MqttPublisher.controlTopic(serial, "mode"), payload);
    }

    /* ===== BINDING_UPDATE : BOUND ===== */
    public void sendBindingBound(
            String serial,
            Long plantId,
            Long speciesId
    ) {
        Species species = speciesRepository.findById(speciesId)
                .orElseThrow(() -> new CustomException(ErrorCode.SPECIES_NOT_FOUND));

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

        publishAndWaitAck(serial, msgId, MqttPublisher.controlTopic(serial, "binding"), payload);
    }

    /* ===== BINDING_UPDATE : UNBOUND ===== */
    public void sendBindingUnbound(String serial) {
        String msgId = UUID.randomUUID().toString();

        Map<String, Object> payload = base(msgId, serial, null, "BINDING_UPDATE");
        payload.put("binding_state", "UNBOUND");
        payload.put("species", null);
        payload.put("led_time", null);
        payload.put("ideal_ranges", null);

        publishAndWaitAck(serial, msgId, MqttPublisher.controlTopic(serial, "binding"), payload);
    }
}
