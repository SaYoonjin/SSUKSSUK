package com.ssukssuk.infra.mqtt.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MqttEnvelope {

    private String topicRaw;
    private String serialNum;
    private Direction direction;
    private String channel;
    private JsonNode payloadJson;

    public enum Direction { TELEMETRY, CONTROL }

    public static MqttEnvelope from(String topic, String payload, ObjectMapper om) throws Exception {
        ParsedTopic parsed = ParsedTopic.parse(topic);
        JsonNode json = om.readTree(payload);

        return MqttEnvelope.builder()
                .topicRaw(topic)
                .serialNum(parsed.serialNum())
                .direction(parsed.direction())
                .channel(parsed.channel())
                .payloadJson(json)
                .build();
    }

    public record ParsedTopic(String serialNum, Direction direction, String channel) {
        public static ParsedTopic parse(String topic) {
            String[] p = topic.split("/");
            if (p.length < 4 || !"devices".equals(p[0])) {
                throw new IllegalArgumentException("INVALID_TOPIC: " + topic);
            }
            String serial = p[1];
            String mid = p[2];
            String channel = p[3];

            Direction dir = switch (mid) {
                case "telemetry" -> Direction.TELEMETRY;
                case "control" -> Direction.CONTROL;
                default -> throw new IllegalArgumentException("INVALID_TOPIC_MIDDLE: " + topic);
            };

            return new ParsedTopic(serial, dir, channel);
        }
    }
}