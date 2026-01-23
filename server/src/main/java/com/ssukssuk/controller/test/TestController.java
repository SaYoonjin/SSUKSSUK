package com.ssukssuk.controller.test;

import com.ssukssuk.common.response.ApiResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
public class TestController {

    @GetMapping("/me")
    public ApiResponse<String> me(Authentication authentication) {
        return ApiResponse.ok(
                "인증 성공: " + authentication.getName()
        );
    }
}
