package com.ssukssuk.dto.auth;

public record LoginResponse(
        Long userId,
        String email,
        boolean isAdmin,
        String accessToken,
        String refreshToken
) {}