package com.ssukssuk.service.plant;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.device.Device;
import com.ssukssuk.domain.plant.UserPlant;
import com.ssukssuk.dto.plant.CreatePlantResponse;
import com.ssukssuk.dto.plant.MyPlantResponse;
import com.ssukssuk.dto.plant.UpdatePlantRequest;
import com.ssukssuk.repository.device.DeviceRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserPlantService {

    private final DeviceRepository deviceRepository;
    private final UserPlantRepository userPlantRepository;
    private final PlantBindingService plantBindingService;
    private final PlantCreationService plantCreationService;

    /**
     * 식물 생성 + 디바이스 바인딩
     * - 식물 생성은 별도 트랜잭션으로 먼저 커밋 (plantId 확보)
     * - 바인딩은 그 후 별도 트랜잭션으로 시도
     */
    public CreatePlantResponse createPlant(
            Long userId,
            Long speciesId,
            Long deviceId,
            String plantName
    ) {

        // 1. 식물 생성 (별도 트랜잭션으로 즉시 커밋 → plantId 확보)
        UserPlant userPlant = plantCreationService.createPlantOnly(userId, speciesId, plantName);

        // 2. 디바이스가 있으면 바인딩 시도
        String bindingError = null;
        Long boundDeviceId = null;

        if (deviceId != null) {
            try {
                // 바인딩 (별도 트랜잭션으로 MQTT + DB)
                plantBindingService.bindWithValidation(userId, userPlant.getPlantId(), deviceId);
                boundDeviceId = deviceId;
            } catch (Exception e) {
                // 바인딩 실패 시 에러 메시지 저장 (식물은 유지)
                bindingError = e.getMessage();
            }
        }

        return CreatePlantResponse.builder()
                .plantId(userPlant.getPlantId())
                .name(userPlant.getPlantName())
                .species(userPlant.getSpecies().getSpeciesId())
                .deviceId(boundDeviceId)
                .characterCode(0)
                .bindingError(bindingError)
                .build();
    }

    public void updatePlant(Long userId, Long plantId, UpdatePlantRequest request) {

        UserPlant plant = userPlantRepository.findByPlantIdAndUserId(plantId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));

        // 1. 이름 변경
        if (request.getName() != null && !request.getName().isBlank()) {
            plant.changeName(request.getName());
        }

        // 2. 디바이스 처리
        Device currentDevice = plant.getDevice();
        boolean currentlyConnected = Boolean.TRUE.equals(plant.getIsConnected());

        // 2-1. 디바이스 연결 해제 요청
        if (Boolean.TRUE.equals(request.getUnbindDevice())) {
            if (currentlyConnected) {
                // 별도 트랜잭션으로 MQTT + DB 처리
                plantBindingService.unbind(plantId);
            }
            return;
        }

        // 2-2. 새 디바이스로 변경 요청
        if (request.getDeviceId() != null) {
            Long newDeviceId = request.getDeviceId();

            // 같은 디바이스면 무시
            if (currentDevice != null && currentDevice.getDeviceId().equals(newDeviceId) && currentlyConnected) {
                return;
            }

            Device newDevice = deviceRepository.findById(newDeviceId)
                    .orElseThrow(() -> new CustomException(ErrorCode.DEVICE_NOT_FOUND));

            // 새 디바이스 소유자 검증
            if (newDevice.getUser() == null || !newDevice.getUser().getId().equals(userId)) {
                throw new CustomException(ErrorCode.DEVICE_NOT_OWNED);
            }

            // 새 디바이스가 이미 다른 식물에 연결되어 있는지 확인
            var existingPlant = userPlantRepository
                    .findConnectedPlantByDeviceId(newDeviceId);
            if (existingPlant.isPresent() && !existingPlant.get().getPlantId().equals(plantId)) {
                throw new CustomException(ErrorCode.DEVICE_ALREADY_PAIRED);
            }

            // 별도 트랜잭션으로 각각 처리 (MQTT 성공 시 즉시 DB 커밋)
            // 1. 기존 디바이스 연결 해제
            if (currentlyConnected) {
                plantBindingService.unbind(plantId);
            }

            // 2. 새 디바이스 연결
            plantBindingService.bind(plantId, newDeviceId);
        }
    }

    public List<MyPlantResponse> getMyPlants(Long userId) {

        // 해당 유저가 키우는 모든 식물 조회
        List<UserPlant> userPlants =
                userPlantRepository.findAllByUserIdWithJoin(userId);

        return userPlants.stream()
                .map(MyPlantResponse::from)
                .toList();
    }

    @Transactional
    public void deletePlant(Long userId, Long plantId) {

        UserPlant plant = userPlantRepository.findByPlantIdAndUserId(plantId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));

        boolean connected = Boolean.TRUE.equals(plant.getIsConnected());

        // 디바이스가 연결돼 있으면 먼저 언바인드
        if (connected) {
            plantBindingService.unbind(plantId);
        }

        // - removedAt 설정
        // - isMain = false
        // - isConnected = false
        // - device = null
        plant.remove();
    }

    @Transactional
    public void switchMainPlant(Long userId, Long plantId) {

        // 1. 요청 plant 조회 (본인 + 삭제 안 된 식물)
        UserPlant targetPlant =
                userPlantRepository.findByPlantIdAndUser_IdAndRemovedAtIsNull(plantId, userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));

        // 2. 이미 메인이면 그대로 종료
        if (targetPlant.isMain()) return;

        // 3. 기존 메인 식물 있으면 해제
        userPlantRepository
                .findByUser_IdAndIsMainTrueAndRemovedAtIsNull(userId)
                .ifPresent(mainPlant -> mainPlant.changeMain(false));

        // 4. 현재 식물 메인 설정
        targetPlant.changeMain(true);
    }


}
