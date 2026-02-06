package com.ssukssuk.dto.history;

import lombok.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GetPlantImagesResponse {

    private Long plantId;
    private Integer period; // 14일
    private List<ImageItem> images;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageItem {
        private Long imageId;
        private String imageUrlTop;
        private String imageUrlSide;
        private OffsetDateTime capturedAt;
    }
}