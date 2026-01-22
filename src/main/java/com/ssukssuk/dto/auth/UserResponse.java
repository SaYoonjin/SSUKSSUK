package com.ssukssuk.dto.auth;

public record UserResponse(
        Long userId,
        String email,
        String nickname,
        boolean isAdmin
) {}