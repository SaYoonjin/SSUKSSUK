package com.ssukssuk.dto.auth;

import com.ssukssuk.domain.auth.UserMode;

public record ModeResponse(
        UserMode mode,
        String updatedAt
) {}