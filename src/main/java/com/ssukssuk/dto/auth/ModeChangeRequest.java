package com.ssukssuk.dto.auth;

import com.ssukssuk.domain.auth.UserMode;
import jakarta.validation.constraints.NotNull;

public record ModeChangeRequest(
        @NotNull(message = "mode는 필수입니다.")
        UserMode mode
) {}