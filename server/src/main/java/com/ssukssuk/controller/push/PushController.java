package com.ssukssuk.controller.push;

import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.dto.push.PushNotiSettingRequest;
import com.ssukssuk.dto.push.PushTokenRequest;
import com.ssukssuk.dto.push.PushTokenResponse;
import com.ssukssuk.service.push.PushService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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

    @PatchMapping("/setting")
    public ApiResponse<Void> updateNotiSetting(
            @AuthenticationPrincipal Long userId,
            @RequestBody @Valid PushNotiSettingRequest request
    ) {
        pushService.updateNotiSetting(
                userId,
                request.getMobileDeviceId(),
                request.getNotiSetting());
        return ApiResponse.ok(null);
    }
}
