package com.ssukssuk.domain.plant;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "plant_status")
public class PlantStatus {

    @Id
    @Column(name = "plant_id")
    private Long plantId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "plant_id")
    private UserPlant userPlant;

    // === 캐릭터(코드 테이블 FK) & 건강 점수 ===
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "character_code", nullable = false)
    private CharacterCode charactercode;

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

    // anomaly 기준 상수 (팀에서 바뀔 수 있으니 상수화)
    private static final int ANOMALY_BAD_THRESHOLD = 3;
    private static final int HEALTH_PENALTY_PER_ISSUE = 20;

    /**
     * 생성 시에는 기본 캐릭터(CharacterCode 엔티티)를 서비스에서 주입해줘야 함.
     * (예: character_code=0 row를 기본 정상 캐릭터로 운영)
     */
    @Builder
    private PlantStatus(UserPlant userPlant, CharacterCode character) {
        if (userPlant == null) throw new IllegalArgumentException("userPlant must not be null");
        if (character == null) throw new IllegalArgumentException("character must not be null");

        this.userPlant = userPlant;
        this.charactercode = character;

        this.healthScore = 100;
        this.hasUnreadNotification = false;
        // updatedAt은 @PrePersist/@PreUpdate에서 자동 갱신
    }

    // === 센서 데이터 업데이트 ===
    public int updateFromSensor(
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

        return recalculateHealthAndComputeCharacterCode();
    }

    // === 이미지 데이터 업데이트 ===
    public int updateFromImage(Double height, Double width, Integer anomaly) {
        this.plantHeight = height;
        this.plantWidth = width;
        this.anomaly = anomaly;

        return recalculateHealthAndComputeCharacterCode();
    }

    // === 알림 상태 ===
    public void markUnreadNotification() {
        this.hasUnreadNotification = true;
    }

    // TODO: 알림 읽기 API 구현 시 호출
    public void clearUnreadNotification() {
        this.hasUnreadNotification = false;
    }

    /**
     * 계산된 캐릭터 코드에 해당하는 CharacterCode 엔티티 적용
     */
    public void applyCharacter(CharacterCode character) {
        if (character == null) return;
        this.charactercode = character;
    }

    /**
     * === 건강점수 & 캐릭터코드(정수) 재계산 ===
     * - 엔티티 내부에서 Repository 접근 불가하므로 "코드(int)"만 리턴한다.
     * - 서비스가 리턴값(code)을 받아 CharacterCode 엔티티를 조회한 뒤 applyCharacter() 호출.
     */
    private int recalculateHealthAndComputeCharacterCode() {
        // 1) 건강점수 계산 (100에서 이상 하나당 -20)
        int score = 100;

        if (temperatureStatus != null && temperatureStatus != SensorStatusType.OK) score -= HEALTH_PENALTY_PER_ISSUE;
        if (humidityStatus != null && humidityStatus != SensorStatusType.OK) score -= HEALTH_PENALTY_PER_ISSUE;
        if (waterLevelStatus != null && waterLevelStatus != SensorStatusType.OK) score -= HEALTH_PENALTY_PER_ISSUE;
        if (nutrientConcStatus != null && nutrientConcStatus != SensorStatusType.OK) score -= HEALTH_PENALTY_PER_ISSUE;
        if (anomaly != null && anomaly >= ANOMALY_BAD_THRESHOLD) score -= HEALTH_PENALTY_PER_ISSUE;

        this.healthScore = Math.max(0, score);

        // 2) 크기 등급 계산 (0~2)
        int sizeGrade = calculateSizeGrade();

        // 3) 캐릭터 코드 결정
        return determineCharacterCode(sizeGrade);
    }

    private int calculateSizeGrade() {
        if (plantHeight == null || plantWidth == null) return 0;

        double area = plantHeight * plantWidth;

        // 0: < 75, 1: 75~225, 2: >= 225 (기준: 15cm*10cm=150이 중간)
        if (area < 75) return 0;
        if (area < 225) return 1;
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
            return 3 + sizeGrade;   // 3~5: 수위/양분 부족
        }
        if (waterOrNutrientUp) {
            return 6 + sizeGrade;   // 6~8: 수위/양분 과다
        }

        // 우선순위 2: 온도 이상
        if (temperatureStatus == SensorStatusType.UP) {
            return 9 + sizeGrade;   // 9~11: 더운 상태
        }
        if (temperatureStatus == SensorStatusType.DOWN) {
            return 12 + sizeGrade;  // 12~14: 추운 상태
        }

        // 우선순위 3: 잎 이상
        if (anomaly != null && anomaly >= ANOMALY_BAD_THRESHOLD) {
            return 3 + sizeGrade;   // 3~5: 영양 부족 캐릭터
        }

        // 정상
        return sizeGrade;           // 0~2: 정상
    }

    @PrePersist
    @PreUpdate
    private void touch() {
        this.updatedAt = LocalDateTime.now();
    }
}