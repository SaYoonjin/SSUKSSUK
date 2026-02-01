package com.ssukssuk.infra.idempotency;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RedisIdempotencyService implements IdempotencyService {

    private final StringRedisTemplate redis;
    private static final Duration TTL = Duration.ofMinutes(10);

    @Override
    public boolean markIfFirst(String key) {
        Boolean ok = redis.opsForValue().setIfAbsent(key, "1", TTL);
        return Boolean.TRUE.equals(ok);
    }
}