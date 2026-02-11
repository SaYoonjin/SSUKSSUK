package com.ssukssuk.domain.device;

import com.ssukssuk.domain.auth.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "device")
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long deviceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "device_serial")
    private String serial;

    @Column(nullable = false)
    private Boolean pairing;

    @Column(name = "claimed_at")
    private LocalDateTime claimedAt;

    @Builder
    public Device(String serial) {
        this.serial = serial;
        this.pairing = false;
    }

    /**
     * 디바이스를 사용자에게 등록 (claim)
     * pairing은 식물 연결 시 별도로 설정
     */
    public void claim(User user) {
        this.user = user;
        this.claimedAt = LocalDateTime.now();
    }

    /**
     * 디바이스 등록 해제 (unclaim)
     * user_id와 pairing 모두 제거
     */
    public void unclaim() {
        this.user = null;
        this.pairing = false;
        this.claimedAt = null;
    }

    /**
     * 식물과 연결 (bind)
     */
    public void bindPlant() {
        this.pairing = true;
    }

    /**
     * 식물 연결 해제 (unbind)
     */
    public void unbindPlant() {
        this.pairing = false;
    }
}
