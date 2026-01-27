package com.ssukssuk.dto.history;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class LatestPlantImageResponse {

    private Long plantId;
    private LocalDateTime capturedAt;
    private List<ImageItem> images;

    @Getter
    @AllArgsConstructor
    public static class ImageItem {
        private String cameraPosition;
        private String imageUrl;
    }
}
