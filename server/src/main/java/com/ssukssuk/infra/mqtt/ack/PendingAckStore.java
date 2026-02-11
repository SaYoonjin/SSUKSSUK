package com.ssukssuk.infra.mqtt.ack;

import com.ssukssuk.infra.mqtt.dto.AckMessage;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.*;

@Component
public class PendingAckStore {

    private record Key(String serial, String refMsgId) {}

    private static class Entry {
        final CompletableFuture<AckMessage> future = new CompletableFuture<>();
        final long expireAtMillis;

        Entry(long expireAtMillis) {
            this.expireAtMillis = expireAtMillis;
        }
    }

    private final Map<Key, Entry> pending = new ConcurrentHashMap<>();

    private final ScheduledExecutorService sweeper =
            Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "pending-ack-sweeper");
                t.setDaemon(true);
                return t;
            });

    public PendingAckStore() {
        sweeper.scheduleAtFixedRate(this::cleanupExpired, 1, 1, TimeUnit.SECONDS);
    }

    public CompletableFuture<AckMessage> register(String serial, String msgId, Duration timeout) {
        long expireAt = System.currentTimeMillis() + timeout.toMillis();
        Key key = new Key(serial, msgId);

        Entry entry = new Entry(expireAt);
        pending.put(key, entry);

        return entry.future;
    }

    public boolean complete(String serial, String refMsgId, AckMessage ack) {
        Key key = new Key(serial, refMsgId);
        Entry entry = pending.remove(key);
        if (entry == null) return false;
        entry.future.complete(ack);
        return true;
    }

    private void cleanupExpired() {
        long now = System.currentTimeMillis();
        pending.entrySet().removeIf(e -> {
            Entry entry = e.getValue();
            if (entry.expireAtMillis < now) {
                if (!entry.future.isDone()) {
                    entry.future.completeExceptionally(
                            new AckTimeoutException(e.getKey().serial, e.getKey().refMsgId)
                    );
                }
                return true;
            }
            return false;
        });
    }
}