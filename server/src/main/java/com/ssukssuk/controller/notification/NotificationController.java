package com.ssukssuk.controller.notification;

import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.dto.notification.NotificationResponse;
import com.ssukssuk.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * - 오늘 알림 리스트 반환과 동시에 알림 전체 읽음 처리
     */
    @PostMapping("/list")
    public ApiResponse<NotificationResponse> openTodayNotifications(
            @AuthenticationPrincipal Long userId
    ) {
        NotificationResponse data = notificationService.openTodayNotifications(userId);
        return ApiResponse.ok(data);
    }


}