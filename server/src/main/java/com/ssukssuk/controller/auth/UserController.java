package com.ssukssuk.controller.auth;

import com.ssukssuk.dto.auth.*;
import com.ssukssuk.service.auth.UserService;
import com.ssukssuk.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
    public ApiResponse<TokenRefreshResponse> refresh(
            @Valid @RequestBody TokenRefreshRequest req
    ) {
        return ApiResponse.ok(userService.refresh(req));
    }

}