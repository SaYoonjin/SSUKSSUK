package com.ssukssuk.domain.plant;

import com.ssukssuk.domain.auth.User;
import com.ssukssuk.domain.device.Device;
import com.ssukssuk.domain.plant.Species;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "user_plant")
public class UserPlant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plant_id")
    private Long plantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "species_id", nullable = false)
    private Species species;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id")
    private Device device;

    @Column(name = "plant_name", nullable = false, length = 50)
    private String plantName;

    @Column(name = "is_connected")
    private Boolean isConnected;

    @Column(name = "is_main")
    private Boolean isMain;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "removed_at")
    private LocalDateTime removedAt;

    @Builder
    private UserPlant(User user,
                      Species species,
                      Device device,
                      String plantName,
                      Boolean isMain) {

        this.user = user;
        this.species = species;
        this.device = device;
        this.plantName = plantName;
        this.isMain = (isMain != null) ? isMain : false;
        this.isConnected = (device != null);  // 디바이스가 있을 때만 연결 상태
        this.createdAt = LocalDateTime.now();
    }

    public void remove() {
        this.removedAt = LocalDateTime.now();
        this.isMain = false;
        unbindDevice();
    }

    public void changeMainFalse() {
        this.isMain = false;
    }

    public boolean isMain() {
        return Boolean.TRUE.equals(this.isMain);
    }

    public void changeMain(boolean main) {
        this.isMain = main;
    }

    public void changeName(String name) {
        this.plantName = name;
    }

    public void bindDevice(Device device) {
        this.device = device;
        this.isConnected = true;
    }

    public void unbindDevice() {
        this.device = null;
        this.isConnected = false;
    }
}