package com.ssukssuk.domain.plant;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "plant_status")
public class PlantStatus {

    @Id
    @Column(name = "plant_id")
    private Long plantId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "plant_id")
    private UserPlant userPlant;

    @Column(name = "character_code", nullable = false)
    private Integer characterCode;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    private PlantStatus(UserPlant userPlant,
                        Integer characterCode) {

        this.userPlant = userPlant;
        this.characterCode = characterCode;
        this.updatedAt = LocalDateTime.now();
    }

    public void changeCharacter(Integer characterCode) {
        this.characterCode = characterCode;
        this.updatedAt = LocalDateTime.now();
    }
}