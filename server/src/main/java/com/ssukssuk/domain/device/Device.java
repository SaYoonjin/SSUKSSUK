package com.ssukssuk.domain.device;

import com.ssukssuk.domain.auth.User;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Entity
@Getter
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

    public void claim(User user) {
        this.user = user;
        this.pairing = true;
        this.claimedAt = LocalDateTime.now();
    }

    public void unclaim() {
        this.user = null;
        this.pairing = false;
        this.claimedAt = null;
    }
}
