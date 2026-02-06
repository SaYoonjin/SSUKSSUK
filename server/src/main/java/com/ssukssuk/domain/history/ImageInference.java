package com.ssukssuk.domain.history;

import com.ssukssuk.domain.plant.UserPlant;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "image_inference")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ImageInference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inference_id")
    private Long inferenceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id")
    private UserPlant plant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "image_id", nullable = false)
    private PlantImage image;

    @Column
    private Double height;

    @Column
    private Double width;

    @Column
    private Integer anomaly;

    @Column(name = "symptom_enum", length = 50)
    private String symptomEnum;

    @Column(nullable = false)
    private Integer confidence;

    @Column(name = "inference_at", nullable = false)
    private OffsetDateTime inferenceAt;
}
