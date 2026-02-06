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
@RequestMapping("/api/auth")
public class UserController {

    private final UserService userService;

    @PostMapping("/signup")
    public ApiResponse<SignupResponse> signUp(@Valid @RequestBody SignUpRequest req) {
        return ApiResponse.ok(userService.signUp(req));
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        return ApiResponse.ok(userService.login(req));
    }

    @PostMapping("/refresh")
    public ApiResponse<TokenRefreshResponse> refresh(
            @Valid @RequestBody TokenRefreshRequest req
    ) {
        return ApiResponse.ok(userService.refresh(req));
    }

    // ✅ 내 정보 조회
    @GetMapping("/me")
    public ApiResponse<MeResponse> me(
            @AuthenticationPrincipal Long userId
    ) {
        return ApiResponse.ok(userService.getMe(userId));
    }

    // ✅ 닉네임 변경
    @PatchMapping("/nickname")
    public ApiResponse<Void> updateNickname(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody NicknameUpdateRequest req
    ) {
        userService.updateNickname(userId, req);
        return ApiResponse.ok();
    }

    // ✅ 비밀번호 변경
    @PatchMapping("/password")
    public ApiResponse<Void> updatePassword(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody PasswordUpdateRequest req
    ) {
        userService.updatePassword(userId, req);
        return ApiResponse.ok();
    }

    // ✅ 로그아웃
    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            @AuthenticationPrincipal Long userId,
            @RequestBody(required = false) LogoutRequest req
    ) {
        userService.logout(userId, req);
        return ApiResponse.ok();
    }

    // ✅ 회원 탈퇴
    @DeleteMapping("/withdraw")
    public ApiResponse<Void> withdraw(
            @AuthenticationPrincipal Long userId
    ) {
        userService.withdraw(userId);
        return ApiResponse.ok();
    }

    // ✅ 모드 변경 (AUTO / MANUAL)
    @PatchMapping("/mode")
    public ApiResponse<ModeResponse> updateMode(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ModeChangeRequest req
    ) {
        return ApiResponse.ok(userService.updateMode(userId, req));
    }

    // 초기 온보딩(스킵/디바이스 등록) 완료 시 호출되는 API
    @PatchMapping("/initialize")
    public ApiResponse<Void> completeInitialization(
            @AuthenticationPrincipal Long userId
    ) {
        userService.completeInitialization(userId);
        return ApiResponse.ok();
    }

}
