package com.ssukssuk.domain.push;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Setter
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "fcm_token",
        indexes = {
                @Index(name = "idx_fcm_user", columnList = "user_id"),
                @Index(name = "idx_fcm_token", columnList = "token"),
                @Index(name = "idx_fcm_device", columnList = "device_id")
        },
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_fcm_user_device",
                        columnNames = {"device_id"}
                )
        }
)
public class PushToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /** 사용자 ID */
    @Column(name = "user_id")
    private Long userId;

    /** FCM 토큰 값 */
    @Column(name = "token", nullable = false, length = 255)
    private String token;

    /** ANDROID */
    @Column(name = "platform", length = 10)
    private String platform;

    /** 디바이스 고유 식별자 */
    @Column(name = "device_id", length = 100)
    private String deviceId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "noti_setting", nullable = false)
    private Boolean notiSetting;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
        this.notiSetting = true;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void updateToken(String token) {
        this.token = token;
    }

    public void updateNotiSetting(boolean notiSetting) {
        this.notiSetting = notiSetting;
    }
}
