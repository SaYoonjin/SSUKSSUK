package com.ssukssuk.service.history;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.dto.history.LatestPlantImageResponse;
import com.ssukssuk.repository.history.PlantImageRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PlantImageQueryService {

    private final PlantImageRepository plantImageRepository;
    private final UserPlantRepository userPlantRepository;

    @Transactional(readOnly = true)
    public LatestPlantImageResponse getLatestImages(Long plantId) {

        if (!userPlantRepository.existsById(plantId)) {
            throw new CustomException(
                    ErrorCode.PLANT_NOT_FOUND,
                    "plantId=" + plantId
            );
        }

        List<LatestPlantImageResponse.ImageItem> images =
                plantImageRepository.findLatestImagesByPlantId(plantId)
                        .stream()
                        .map(img -> new LatestPlantImageResponse.ImageItem(
                                img.getCameraPosition(),   // 이미 String
                                img.getImageUrl()
                        ))
                        .toList();

        if (images.isEmpty()) {
            return new LatestPlantImageResponse(
                    plantId,
                    null,
                    List.of()
            );
        }

        LocalDateTime latestCapturedAt =
                plantImageRepository.findLatestCapturedAt(plantId);

        return new LatestPlantImageResponse(
                plantId,
                latestCapturedAt,
                images
        );
    }
}
