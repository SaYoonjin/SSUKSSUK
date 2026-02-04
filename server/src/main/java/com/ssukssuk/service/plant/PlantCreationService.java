package com.ssukssuk.service.plant;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.auth.User;
import com.ssukssuk.domain.plant.CharacterCode;
import com.ssukssuk.domain.plant.PlantStatus;
import com.ssukssuk.domain.plant.Species;
import com.ssukssuk.domain.plant.UserPlant;
import com.ssukssuk.repository.auth.UserRepository;
import com.ssukssuk.repository.plant.CharacterCodeRepository;
import com.ssukssuk.repository.plant.PlantStatusRepository;
import com.ssukssuk.repository.plant.SpeciesRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 식물 생성 전용 서비스
 * REQUIRES_NEW로 즉시 커밋하여 plantId를 확보
 */
@Service
@RequiredArgsConstructor
public class PlantCreationService {

    private static final int DEFAULT_CHARACTER_CODE = 0;

    private final UserRepository userRepository;
    private final SpeciesRepository speciesRepository;
    private final UserPlantRepository userPlantRepository;
    private final PlantStatusRepository plantStatusRepository;
    private final CharacterCodeRepository characterCodeRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public UserPlant createPlantOnly(Long userId, Long speciesId, String plantName) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Species species = speciesRepository.findById(speciesId)
                .orElseThrow(() -> new CustomException(ErrorCode.SPECIES_NOT_FOUND));

        UserPlant userPlant = UserPlant.builder()
                .user(user)
                .species(species)
                .device(null)
                .plantName(plantName)
                .isMain(false)
                .build();

        userPlantRepository.save(userPlant);

        CharacterCode defaultCharacter = characterCodeRepository.findById(DEFAULT_CHARACTER_CODE)
                .orElseThrow(() -> new CustomException(ErrorCode.CHARACTER_CODE_NOT_FOUND));

        PlantStatus plantStatus = PlantStatus.builder()
                .userPlant(userPlant)
                .character(defaultCharacter)
                .build();

        plantStatusRepository.save(plantStatus);

        return userPlant;
    }
}