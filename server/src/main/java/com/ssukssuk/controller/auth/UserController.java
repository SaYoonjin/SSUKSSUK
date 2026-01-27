package com.ssukssuk.controller.auth;

import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.dto.auth.*;
import com.ssukssuk.service.auth.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/auth")
public class UserController {

    private final UserService userService;

    @PostMapping("/signup")
    public ApiResponse<UserResponse> signUp(@Valid @RequestBody SignUpRequest req) {
        return ApiResponse.ok(userService.signUp(req));
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        return ApiResponse.ok(userService.login(req));
    }

    @PostMapping("/refresh")
    public ApiResponse<TokenRefreshResponse> refresh(@Valid @RequestBody TokenRefreshRequest req) {
        return ApiResponse.ok(userService.refresh(req));
    }

    @GetMapping("/me")
    public ApiResponse<MeResponse> me(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(userService.getMe(userId));
    }

    @PatchMapping("/nickname")
    public ApiResponse<Void> updateNickname(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody NicknameUpdateRequest req
    ) {
        userService.updateNickname(userId, req);
        return ApiResponse.ok();
    }

    @PatchMapping("/password")
    public ApiResponse<Void> updatePassword(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody PasswordUpdateRequest req
    ) {
        userService.updatePassword(userId, req);
        return ApiResponse.ok();
    }
}