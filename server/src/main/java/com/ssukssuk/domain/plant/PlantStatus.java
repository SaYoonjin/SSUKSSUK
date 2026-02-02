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

    // === 캐릭터 & 건강 점수 ===
    @Column(name = "character_code", nullable = false)
    private Integer characterCode;

    @Column(name = "health_score", nullable = false)
    private Integer healthScore;

    // === 센서 상태 (OK, UP, DOWN) ===
    @Enumerated(EnumType.STRING)
    @Column(name = "water_level_status", length = 10)
    private SensorStatusType waterLevelStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "nutrient_conc_status", length = 10)
    private SensorStatusType nutrientConcStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "temperature_status", length = 10)
    private SensorStatusType temperatureStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "humidity_status", length = 10)
    private SensorStatusType humidityStatus;

    // === 센서 값 (온도, 습도) ===
    @Column(name = "temperature")
    private Float temperature;

    @Column(name = "humidity")
    private Float humidity;

    // === 이미지 관련 ===
    @Column(name = "plant_height")
    private Double plantHeight;

    @Column(name = "plant_width")
    private Double plantWidth;

    @Column(name = "anomaly")
    private Integer anomaly;

    // === 알림 ===
    @Column(name = "has_unread_notification", nullable = false)
    private Boolean hasUnreadNotification;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum SensorStatusType {
        OK, UP, DOWN
    }

    @Builder
    private PlantStatus(UserPlant userPlant, Integer characterCode) {
        this.userPlant = userPlant;
        this.characterCode = characterCode != null ? characterCode : 0;
        this.healthScore = 100;
        this.hasUnreadNotification = false;
        this.updatedAt = LocalDateTime.now();
    }

    // === 센서 데이터 업데이트 ===
    public void updateFromSensor(
            Float temperature,
            Float humidity,
            SensorStatusType temperatureStatus,
            SensorStatusType humidityStatus,
            SensorStatusType waterLevelStatus,
            SensorStatusType nutrientConcStatus
    ) {
        this.temperature = temperature;
        this.humidity = humidity;
        this.temperatureStatus = temperatureStatus;
        this.humidityStatus = humidityStatus;
        this.waterLevelStatus = waterLevelStatus;
        this.nutrientConcStatus = nutrientConcStatus;

        recalculateHealthAndCharacter();
        this.updatedAt = LocalDateTime.now();
    }

    // === 이미지 데이터 업데이트 ===
    public void updateFromImage(Double height, Double width, Integer anomaly) {
        this.plantHeight = height;
        this.plantWidth = width;
        this.anomaly = anomaly;

        recalculateHealthAndCharacter();
        this.updatedAt = LocalDateTime.now();
    }

    // === 알림 상태 ===
    public void markUnreadNotification() {
        this.hasUnreadNotification = true;
        this.updatedAt = LocalDateTime.now();
    }

    // TODO: 알림 읽기 API 구현 시 호출
    public void clearUnreadNotification() {
        this.hasUnreadNotification = false;
        this.updatedAt = LocalDateTime.now();
    }

    // === 건강점수 & 캐릭터코드 재계산 ===
    private void recalculateHealthAndCharacter() {
        // 1. 건강점수 계산 (100에서 이상 하나당 -20)
        int score = 100;
        if (temperatureStatus != null && temperatureStatus != SensorStatusType.OK) score -= 20;
        if (humidityStatus != null && humidityStatus != SensorStatusType.OK) score -= 20;
        if (waterLevelStatus != null && waterLevelStatus != SensorStatusType.OK) score -= 20;
        if (nutrientConcStatus != null && nutrientConcStatus != SensorStatusType.OK) score -= 20;
        if (anomaly != null && anomaly >= 3) score -= 20;  // 이미지 이상 (anomaly >= 3)
        this.healthScore = Math.max(0, score);

        // 2. 크기 등급 계산 (0~3)
        int sizeGrade = calculateSizeGrade();

        // 3. 캐릭터 코드 결정 (우선순위: 수위/양분 > 온도 > 정상)
        this.characterCode = determineCharacterCode(sizeGrade);
    }

    private int calculateSizeGrade() {
        if (plantHeight == null || plantWidth == null) {
            return 0;  // 기본값
        }
        double area = plantHeight * plantWidth;

        // 크기 기준 (height * width 기준) - 3단계
        // 0: < 150, 1: 150~450, 2: >= 450
        if (area < 150) return 0;
        if (area < 450) return 1;
        return 2;
    }

    private int determineCharacterCode(int sizeGrade) {
        // 우선순위 1: 수위/양분 이상
        boolean waterOrNutrientDown =
                (waterLevelStatus == SensorStatusType.DOWN) ||
                (nutrientConcStatus == SensorStatusType.DOWN);
        boolean waterOrNutrientUp =
                (waterLevelStatus == SensorStatusType.UP) ||
                (nutrientConcStatus == SensorStatusType.UP);

        if (waterOrNutrientDown) {
            return 3 + sizeGrade;  // 3~5: 수위/양분 부족
        }
        if (waterOrNutrientUp) {
            return 6 + sizeGrade;  // 6~8: 수위/양분 과다
        }

        // 우선순위 2: 온도 이상
        if (temperatureStatus == SensorStatusType.UP) {
            return 9 + sizeGrade;  // 9~11: 더운 상태
        }
        if (temperatureStatus == SensorStatusType.DOWN) {
            return 12 + sizeGrade;  // 12~14: 추운 상태
        }

        // 정상
        return sizeGrade;  // 0~2: 정상
    }
}