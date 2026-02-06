package com.ssukssuk.dto.auth;

public record TokenRefreshResponse(
        String accessToken,
        String refreshToken,
        long expiresIn
) {}
