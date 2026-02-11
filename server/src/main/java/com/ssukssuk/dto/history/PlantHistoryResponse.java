package com.ssukssuk.dto.history;

import lombok.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlantHistoryResponse {

    private Long plantId;
    private String plantName;

    private CurrentImage currentImage;
    private GrowthGraph growthGraph;
    private SensorAlertGraph sensorAlertGraph;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CurrentImage {
        private String imageUrl_top;
        private String imageUrl_side;
        private OffsetDateTime capturedAt;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GrowthGraph {
        private String unit; // "cm"
        private Period period;
        private List<GrowthPoint> data;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GrowthPoint {
        private String date;
        private Double height;
        private Double width;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SensorAlertGraph {
        private Period period;
        private List<SensorAlertPoint> data;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SensorAlertPoint {
        private String date;
        private int total;
        private int water;
        private int nutrient;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Period {
        private String start;
        private String end;
    }
}