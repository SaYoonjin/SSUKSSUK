package com.ssukssuk.dto.auth;

public record LoginResponse(
        Long userId,
        String email,
        String nickname,
        String mode,
        boolean isAdmin,
        String accessToken,
        String refreshToken
) {}