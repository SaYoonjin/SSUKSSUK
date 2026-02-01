package com.ssukssuk.dto.auth;

public record LoginResponse(
        Long userId,
        String email,
        boolean isAdmin,
        boolean isInitialized,
        String accessToken,
        String refreshToken
) {}