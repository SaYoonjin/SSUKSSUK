package com.ssukssuk.infra.mqtt.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssukssuk.infra.mqtt.dto.AckMessage;
import com.ssukssuk.infra.mqtt.dto.MqttEnvelope;
import com.ssukssuk.infra.mqtt.ack.PendingAckStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component("ack")
@RequiredArgsConstructor
public class AckInboundHandler implements MqttMessageHandler {

    private final ObjectMapper objectMapper;
    private final PendingAckStore pendingAckStore;

    @Override
    public void handle(MqttEnvelope envelope) {
        // ACK은 devices/{serial}/telemetry/ack 토픽으로 들어옴
        if (envelope.getDirection() != MqttEnvelope.Direction.TELEMETRY) return;

        try {
            AckMessage ack = objectMapper.treeToValue(envelope.getPayloadJson(), AckMessage.class);

            boolean matched = pendingAckStore.complete(
                    envelope.getSerialNum(),
                    ack.getRef_msg_id(),
                    ack
            );

            if (!matched) {
                log.warn("[MQTT][ACK] no pending found. serial={}, ref_msg_id={}",
                        envelope.getSerialNum(), ack.getRef_msg_id());
            }

        } catch (Exception e) {
            log.warn("[MQTT][ACK] parse failed. topic={}", envelope.getTopicRaw(), e);
        }
    }
}