package com.ssukssuk.controller.auth;

import com.ssukssuk.dto.auth.LoginResponse;
import com.ssukssuk.service.auth.UserService;
import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.dto.auth.UserResponse;
import com.ssukssuk.dto.auth.LoginRequest;
import com.ssukssuk.dto.auth.SignUpRequest;
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
}