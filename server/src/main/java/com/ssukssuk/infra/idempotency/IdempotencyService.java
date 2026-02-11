package com.ssukssuk.infra.idempotency;

public interface IdempotencyService {
    boolean markIfFirst(String key);
}