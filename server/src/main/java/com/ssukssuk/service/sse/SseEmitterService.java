package com.ssukssuk.service.sse;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssukssuk.domain.plant.PlantStatus;
import com.ssukssuk.dto.home.HomeResponse;
import com.ssukssuk.event.PlantStatusUpdatedEvent;
import com.ssukssuk.repository.plant.CharacterCodeRepository;
import com.ssukssuk.repository.plant.PlantStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class SseEmitterService {

    private static final Long SSE_TIMEOUT = 60 * 60 * 1000L; // 1시간
    private static final String REDIS_CHANNEL = "plant-status-update";

    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    private final PlantStatusRepository plantStatusRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final TransactionTemplate transactionTemplate;
    private final ObjectMapper objectMapper;

    /**
     * SSE 구독 시작
     */
    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        // 기존 연결이 있으면 완료 처리
        SseEmitter oldEmitter = emitters.get(userId);
        if (oldEmitter != null) {
            oldEmitter.complete();
        }

        emitters.put(userId, emitter);

        emitter.onCompletion(() -> {
            log.info("[SSE] 연결 완료: userId={}", userId);
            emitters.remove(userId);
        });

        emitter.onTimeout(() -> {
            log.info("[SSE] 연결 타임아웃: userId={}", userId);
            emitter.complete();
            emitters.remove(userId);
        });

        emitter.onError(e -> {
            log.warn("[SSE] 연결 에러: userId={}, error={}", userId, e.getMessage());
            emitters.remove(userId);
        });

        // 연결 성공 이벤트 전송
        try {
            emitter.send(SseEmitter.event()
                    .name("connect")
                    .data("connected"));
        } catch (IOException e) {
            log.error("[SSE] 연결 이벤트 전송 실패: userId={}", userId, e);
            emitters.remove(userId);
        }

        return emitter;
    }

    /**
     * SSE 구독 해제
     */
    public void unsubscribe(Long userId) {
        SseEmitter emitter = emitters.remove(userId);
        if (emitter != null) {
            emitter.complete();
        }
    }

    /**
     * PlantStatus 업데이트 이벤트 수신 → Redis 발행
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handlePlantStatusUpdated(PlantStatusUpdatedEvent event) {
        Long plantId = event.getPlantId();
        log.debug("[SSE] PlantStatus 업데이트 이벤트 수신: plantId={}", plantId);

        // Redis Pub/Sub으로 발행 (다중 서버 지원)
        redisTemplate.convertAndSend(REDIS_CHANNEL, plantId.toString());
    }

    /**
     * Redis 메시지 수신 → SSE push
     */
    public void onRedisMessage(String message) {
        try {
            Long plantId = Long.parseLong(message);
            pushToUser(plantId);
        } catch (NumberFormatException e) {
            log.error("[SSE] Redis 메시지 파싱 실패: {}", message, e);
        }
    }

    private void pushToUser(Long plantId) {
        // 트랜잭션 내에서 조회 (단일 쿼리로 PlantStatus + UserPlant join fetch)
        PlantStatus status = transactionTemplate.execute(txStatus ->
                plantStatusRepository.findMainPlantStatusByPlantId(plantId).orElse(null)
        );

        if (status == null) {
            return; // main plant가 아니거나 존재하지 않음
        }

        Long userId = status.getUserPlant().getUser().getId();
        SseEmitter emitter = emitters.get(userId);

        if (emitter == null) {
            return; // SSE 연결 없음 (홈 화면에 없음)
        }

        try {
            String url = status.getCharactercode().getImageUrl();
            HomeResponse response = HomeResponse.from(status.getUserPlant(), status, url);
            emitter.send(SseEmitter.event()
                    .name("update")
                    .data(objectMapper.writeValueAsString(response)));
            log.debug("[SSE] push 성공: userId={}, plantId={}", userId, plantId);
        } catch (IOException e) {
            log.error("[SSE] push 실패: userId={}", userId, e);
            emitters.remove(userId);
        }
    }
}
