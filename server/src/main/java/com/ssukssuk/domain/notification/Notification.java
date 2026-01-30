package com.ssukssuk.domain.notification;

import com.ssukssuk.domain.auth.User;
import com.ssukssuk.domain.history.ImageInference;
import com.ssukssuk.domain.history.SensorEvent;
import com.ssukssuk.domain.plant.UserPlant;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id", nullable = false)
    private UserPlant plant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private SensorEvent event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inference_id")
    private ImageInference inference;

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
            User user,
            UserPlant plant,
            SensorEvent event,
            ImageInference inference,
            NotiType notiType,
            NotiTitle notiTitle,
            String message
    ) {
        Notification n = new Notification();
        n.user = require(user, "user");
        n.plant = require(plant, "plant");
        n.event = event;
        n.inference = inference;
        n.notiType = require(notiType, "notiType");
        n.notiTitle = require(notiTitle, "notiTitle");
        n.message = requireText(message, "message");
        n.createdAt = LocalDateTime.now();
        return n;
    }

    public enum NotiType {
        SENSOR, IMAGE, ACTION_DONE, ACTION_FAIL, RECOVERY
    }

    public enum NotiTitle {
        WATER_LEVEL, TEMPERATURE, NUTRIENT_CONC, HUMIDITY,
        DISCOLORATION,
        ACTION_DONE,
        ACTION_FAIL,
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