package com.ssukssuk.service.plant;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.auth.User;
import com.ssukssuk.domain.device.Device;
import com.ssukssuk.domain.plant.PlantStatus;
import com.ssukssuk.domain.plant.Species;
import com.ssukssuk.domain.plant.UserPlant;
import com.ssukssuk.dto.plant.CreatePlantResponse;
import com.ssukssuk.repository.auth.UserRepository;
import com.ssukssuk.repository.device.DeviceRepository;
import com.ssukssuk.repository.plant.PlantStatusRepository;
import com.ssukssuk.repository.plant.SpeciesRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserPlantService {

    private final UserRepository userRepository;
    private final SpeciesRepository speciesRepository;
    private final DeviceRepository deviceRepository;
    private final UserPlantRepository userPlantRepository;
    private final PlantStatusRepository plantStatusRepository;


    @Transactional
    public CreatePlantResponse createPlant(
            Long userId,
            Long speciesId,
            Long deviceId,
            String plantName,
            Boolean isMain
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Species species = speciesRepository.findById(speciesId)
                .orElseThrow(() -> new CustomException(ErrorCode.SPECIES_NOT_FOUND));

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new CustomException(ErrorCode.DEVICE_NOT_FOUND));

        // 대표 식물 중복 방지
        if (Boolean.TRUE.equals(isMain)) {
            userPlantRepository.findByUser_IdAndIsMainTrueAndRemovedAtIsNull(userId)
                    .ifPresent(p -> {
                        throw new CustomException(ErrorCode.PLANT_ALREADY_MAIN);
                    });
        }

        UserPlant userPlant = UserPlant.builder()
                .user(user)
                .species(species)
                .device(device)
                .plantName(plantName)
                .isMain(isMain)
                .build();

        userPlantRepository.save(userPlant);

        int initialCharacterCode = 0;

        PlantStatus plantStatus = PlantStatus.builder()
                .userPlant(userPlant)
                .characterCode(0)
                .build();

        userPlantRepository.save(userPlant);

        return CreatePlantResponse.builder()
                .plantId(userPlant.getPlantId())
                .name(userPlant.getPlantName())
                .species(species.getSpeciesId())
                .deviceId(device.getDeviceId())
                .characterCode(0)
                .build();
    }
}