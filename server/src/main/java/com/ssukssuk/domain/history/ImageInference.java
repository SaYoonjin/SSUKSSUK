package com.ssukssuk.domain.history;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

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
    @JoinColumn(name = "image_id", nullable = false)
    private PlantImage plantImage;

    @Column(nullable = false)
    private Double height;

    @Column(nullable = false)
    private Double width;

    @Column(nullable = false)
    private Boolean anomaly;

    @Column(nullable = false)
    private Double confidence;

    @Column(name = "inference_at", nullable = false)
    private LocalDateTime inferenceAt;
}
