package com.ssukssuk.domain.notification;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "notification",
        indexes = {
                @Index(name = "idx_notification_plant_id_created_at", columnList = "plant_id, created_at")
        })
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;

    @Column(name = "plant_id", nullable = false)
    private Long plantId;

    @Column(name = "event_id")
    private Long eventId;

    @Column(name = "noti_type", nullable = false, length = 50)
    private String notiType; // ex) WATER_ACTION_DONE, NUTRIENT_ACTION_DONE

    @Column(name = "message", nullable = false, length = 255)
    private String message;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    public static Notification create(Long plantId, Long eventId, String notiType, String message) {
        Notification n = new Notification();
        n.plantId = plantId;
        n.eventId = eventId;
        n.notiType = notiType;
        n.message = message;
        n.createdAt = LocalDateTime.now();
        return n;
    }

    public void markRead(LocalDateTime readAt) {
        this.readAt = readAt != null ? readAt : LocalDateTime.now();
    }
}