package com.ssukssuk.infra.mqtt.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssukssuk.infra.mqtt.dto.ActionResultMessage;
import com.ssukssuk.infra.mqtt.dto.MqttEnvelope;
import com.ssukssuk.infra.idempotency.IdempotencyService;
import com.ssukssuk.service.history.ActionResultService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;


@Slf4j
@Component("action-result")
@RequiredArgsConstructor
public class ActionResultHandler implements MqttMessageHandler {

    private final ObjectMapper objectMapper;
    private final IdempotencyService idempotencyService;
    private final ActionResultService actionResultService;

    @Override
    public void handle(MqttEnvelope envelope) {

        if (envelope.getDirection() != MqttEnvelope.Direction.TELEMETRY) return;

        ActionResultMessage msg;
        try {
            msg = objectMapper.treeToValue(envelope.getPayloadJson(), ActionResultMessage.class);
        } catch (Exception e) {
            log.warn("[MQTT][ACTION_RESULT] JSON parse failed. topic={}, payload={}",
                    envelope.getTopicRaw(), envelope.getPayloadJson(), e);
            return;
        }

        String serial = envelope.getSerialNum();
        log.info("[MQTT][ACTION_RESULT] received. serial={}, msgId={}, plantId={}",
                serial, msg.getMsgId(), msg.getPlantId());

        if (msg.getPlantId() == null) {
            log.warn("[MQTT][ACTION_RESULT] plant_id is null. msgId={}", msg.getMsgId());
            return;
        }

        // 멱등키: serial:msg_id
        String key = serial + ":" + msg.getMsgId();
        if (!idempotencyService.markIfFirst(key)) {
            log.info("[MQTT][ACTION_RESULT] duplicate ignored: {}", key);
            return;
        }

        actionResultService.handle(envelope, msg);
    }
}