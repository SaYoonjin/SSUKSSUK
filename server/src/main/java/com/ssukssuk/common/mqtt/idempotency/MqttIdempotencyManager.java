package com.ssukssuk.common.mqtt.idempotency;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class MqttIdempotencyManager {

    private static final Duration TTL = Duration.ofHours(24);

    private final RedisTemplate<String, String> redisTemplate;

    public boolean firstSeen(String msgId) {
        Boolean ok = redisTemplate.opsForValue()
                .setIfAbsent(key(msgId), "1", TTL);
        return Boolean.TRUE.equals(ok);
    }

    private String key(String msgId) {
        return "mqtt:msg:" + msgId;
    }
}
