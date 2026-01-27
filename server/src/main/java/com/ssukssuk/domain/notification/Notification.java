package com.ssukssuk.domain.notification;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(
        name = "notification",
        indexes = {
                @Index(name = "idx_notification_user_created_at", columnList = "user_id, created_at"),
                @Index(name = "idx_notification_plant_created_at", columnList = "plant_id, created_at"),
                @Index(name = "idx_notification_event_id", columnList = "event_id"),
                @Index(name = "idx_notification_inference_id", columnList = "inference_id")
        }
)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "plant_id", nullable = false)
    private Long plantId;

    @Column(name = "event_id")
    private Long eventId;

    @Column(name = "inference_id")
    private Long inferenceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "noti_type", nullable = false, length = 20)
    private NotiType notiType;

    @Enumerated(EnumType.STRING)
    @Column(name = "noti_title", nullable = false, length = 20)
    private NotiTitle notiTitle;

    @Column(name = "message", nullable = false, length = 255)
    private String message;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    public void markRead(LocalDateTime readAt) {
        this.readAt = (readAt != null) ? readAt : LocalDateTime.now();
    }

    public static Notification of(
            Long userId,
            Long plantId,
            Long eventId,
            Long inferenceId,
            NotiType notiType,
            NotiTitle notiTitle,
            String message
    ) {
        Notification n = new Notification();
        n.userId = require(userId, "userId");
        n.plantId = require(plantId, "plantId");
        n.eventId = eventId;
        n.inferenceId = inferenceId;
        n.notiType = require(notiType, "notiType");
        n.notiTitle = require(notiTitle, "notiTitle");
        n.message = requireText(message, "message");
        n.createdAt = LocalDateTime.now();
        return n;
    }

    public enum NotiType {
        SENSOR, IMAGE, ACTION_DONE
    }

    public enum NotiTitle {
        WATER_LEVEL, TEMPERATURE, NUTRIENT_CONC, HUMIDITY,
        DISCOLORATION,
        ACTION_DONE
    }

    private static <T> T require(T v, String f) {
        if (v == null) throw new IllegalArgumentException(f + " must not be null");
        return v;
    }

    private static String requireText(String v, String f) {
        if (v == null || v.isBlank()) throw new IllegalArgumentException(f + " must not be blank");
        return v;
    }
}