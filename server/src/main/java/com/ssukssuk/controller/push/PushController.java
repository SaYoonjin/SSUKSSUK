package com.ssukssuk.controller.push;

import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.dto.push.PushTokenRequest;
import com.ssukssuk.dto.push.PushTokenResponse;
import com.ssukssuk.service.push.PushService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/fcm")
@RequiredArgsConstructor
public class PushController {

    private final PushService pushService;

    @PostMapping("/token")
    public ApiResponse<PushTokenResponse> registerToken(
            @RequestBody @Valid PushTokenRequest request
    ) {
        return ApiResponse.ok(
                pushService.registerToken(request)
        );
    }
}
