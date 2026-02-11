package com.ssukssuk.dto.notification;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class NotificationResponse {

    private String date;
    private int updatedCount;
    private List<NotificationItem> notifications;

    @Getter
    @Builder
    public static class NotificationItem {
        private Long notificationId;
        private String message;
        private LocalDateTime createdAt;
    }

    public static NotificationResponse of(
            LocalDate date,
            int updatedCount,
            List<NotificationItem> notifications
    ) {
        return NotificationResponse.builder()
                .date(date.toString())
                .updatedCount(updatedCount)
                .notifications(notifications)
                .build();
    }
}