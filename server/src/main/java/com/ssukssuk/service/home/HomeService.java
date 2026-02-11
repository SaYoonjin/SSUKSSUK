package com.ssukssuk.service.home;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.plant.PlantStatus;
import com.ssukssuk.dto.home.HomeResponse;
import com.ssukssuk.repository.plant.PlantStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HomeService {

    private final PlantStatusRepository plantStatusRepository;

    public HomeResponse getHome(Long userId) {
        PlantStatus status = plantStatusRepository.findMainPlantStatusByUserId(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));

        return HomeResponse.from(status.getUserPlant(), status, status.getCharactercode().getImageUrl());
    }
}
