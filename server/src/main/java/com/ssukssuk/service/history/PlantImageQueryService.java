package com.ssukssuk.service.history;

import com.ssukssuk.domain.history.PlantImage;
import com.ssukssuk.dto.history.GetPlantImagesResponse;
import com.ssukssuk.repository.history.PlantImageRepository;
import com.ssukssuk.service.s3.S3PresignService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlantImageQueryService {

    private static final int FIXED_PERIOD_DAYS = 14;
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final PlantImageRepository plantImageRepository;
    private final S3PresignService s3PresignService;

    public GetPlantImagesResponse getRecent14DaysImages(Long plantId) {

        LocalDate today = LocalDate.now(KST);
        LocalDate fromDate = today.minusDays(FIXED_PERIOD_DAYS - 1);

        LocalDateTime from = fromDate.atStartOfDay();
        LocalDateTime to = today.plusDays(1).atStartOfDay();

        List<PlantImage> rows = plantImageRepository.findRecentImagesByPlantId(plantId, from, to);

        List<GetPlantImagesResponse.ImageItem> images = rows.stream()
                // PlantImage 엔티티 1개를 ImageItem DTO 1개로 매핑
                .map(pi -> GetPlantImagesResponse.ImageItem.builder()
                        .imageId(pi.getImageId())
                        .imageUrlTop(s3PresignService.toPublicUrl(pi.getImageUrlTop()))
                        .imageUrlSide(s3PresignService.toPublicUrl(pi.getImageUrlSide()))
                        .capturedAt(pi.getCapturedAt())
                        .build())
                .toList();

        return GetPlantImagesResponse.builder()
                .plantId(plantId)
                .period(FIXED_PERIOD_DAYS)
                .images(images)
                .build();
    }
}