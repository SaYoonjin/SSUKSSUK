package com.ssukssuk.service.history;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.history.PlantImage;
import com.ssukssuk.dto.history.GetPlantImagesResponse;
import com.ssukssuk.dto.history.PlantHistoryResponse;
import com.ssukssuk.repository.history.PlantImageRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import com.ssukssuk.service.s3.S3PresignService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlantImageQueryService {

    private static final int FIXED_PERIOD_DAYS = 14;
    private static final ZoneId KST_ZONE = ZoneId.of("Asia/Seoul");
    private static final ZoneOffset KST_OFFSET = ZoneOffset.ofHours(9);

    private final PlantImageRepository plantImageRepository;
    private final S3PresignService s3PresignService;
    private final UserPlantRepository userPlantRepository;

    // 특정 식물의 최근 14일간 이미지 조회 (사용자 소유 여부 검증 포함)
    public GetPlantImagesResponse getRecent14DaysImages(Long userId, Long plantId) {

        // 사용자-식물 소유 관계 검증
        if (!userPlantRepository.existsByPlantIdAndUserId(plantId, userId)) {
            throw new CustomException(ErrorCode.PLANT_ACCESS_DENIED);
        }

        LocalDate today = LocalDate.now(KST_ZONE);
        LocalDate fromDate = today.minusDays(FIXED_PERIOD_DAYS - 1);

        // [from, to) : fromDate 00:00:00+09:00  ~  (today+1) 00:00:00+09:00
        OffsetDateTime from = fromDate.atStartOfDay().atOffset(KST_OFFSET);
        OffsetDateTime to = today.plusDays(1).atStartOfDay().atOffset(KST_OFFSET);

        List<PlantImage> rows = plantImageRepository.findRecentImagesByPlantId(plantId, from, to);

        List<GetPlantImagesResponse.ImageItem> images = rows.stream()
                .map(pi -> GetPlantImagesResponse.ImageItem.builder()
                        .imageId(pi.getImageId())
                        .imageUrlTop(safePublicUrl(pi.getImageUrlTop()))
                        .imageUrlSide(safePublicUrl(pi.getImageUrlSide()))
                        .capturedAt(pi.getCapturedAt())
                        .build())
                .toList();

        return GetPlantImagesResponse.builder()
                .plantId(plantId)
                .period(FIXED_PERIOD_DAYS)
                .images(images)
                .build();
    }

    // 히스토리 탭에 최근 사진
    public PlantHistoryResponse.CurrentImage getLatestTopSideImage(Long userId, Long plantId) {

        // 사용자-식물 소유 관계 검증
        if (!userPlantRepository.existsByPlantIdAndUserId(plantId, userId)) {
            throw new CustomException(ErrorCode.PLANT_ACCESS_DENIED);
        }

        PlantImage latest = plantImageRepository
                .findLatestByPlantId(plantId, PageRequest.of(0, 1))
                .stream()
                .findFirst()
                .orElse(null);

        if (latest == null) {
            return PlantHistoryResponse.CurrentImage.builder()
                    .imageUrl_top(null)
                    .imageUrl_side(null)
                    .capturedAt(null)
                    .build();
        }

        return PlantHistoryResponse.CurrentImage.builder()
                .imageUrl_top(safePublicUrl(latest.getImageUrlTop()))
                .imageUrl_side(safePublicUrl(latest.getImageUrlSide()))
                .capturedAt(latest.getCapturedAt())
                .build();
    }

    /**
     * null-safe public URL 변환
     */
    private String safePublicUrl(String path) {
        return path == null ? null : s3PresignService.toPublicUrl(path);
    }
}
