package com.ssukssuk.controller.home;

import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.dto.home.HomeResponse;
import com.ssukssuk.service.home.HomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/home")
public class HomeController {

    private final HomeService homeService;

    @GetMapping
    public ApiResponse<HomeResponse> getHome(@AuthenticationPrincipal Long userId) {
        HomeResponse response = homeService.getHome(userId);
        return ApiResponse.ok(response);
    }
}
