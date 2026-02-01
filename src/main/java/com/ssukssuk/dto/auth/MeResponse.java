package com.ssukssuk.dto.auth;

public record MeResponse(
        Long userId,
        String nickname,
        boolean isInitialized
) {}