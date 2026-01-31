package com.ssukssuk.service.plant;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.auth.User;
import com.ssukssuk.domain.device.Device;
import com.ssukssuk.domain.plant.PlantStatus;
import com.ssukssuk.domain.plant.Species;
import com.ssukssuk.domain.plant.UserPlant;
import com.ssukssuk.dto.plant.CreatePlantResponse;
import com.ssukssuk.dto.plant.UpdatePlantRequest;
import com.ssukssuk.repository.auth.UserRepository;
import com.ssukssuk.repository.device.DeviceRepository;
import com.ssukssuk.repository.plant.PlantStatusRepository;
import com.ssukssuk.repository.plant.SpeciesRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import com.ssukssuk.service.device.DeviceControlService;
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
    private final DeviceControlService deviceControlService;
    private final PlantBindingService plantBindingService;

    public CreatePlantResponse createPlant(
            Long userId,
            Long speciesId,
            Long deviceId,
            String plantName
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Species species = speciesRepository.findById(speciesId)
                .orElseThrow(() -> new CustomException(ErrorCode.SPECIES_NOT_FOUND));

        Device device = null;
        boolean shouldBeMain = false;

        // 디바이스가 있는 경우에만 연결 처리
        if (deviceId != null) {
            device = deviceRepository.findById(deviceId)
                    .orElseThrow(() -> new CustomException(ErrorCode.DEVICE_NOT_FOUND));

            // 디바이스 소유자 검증
            if (device.getUser() == null || !device.getUser().getId().equals(userId)) {
                throw new CustomException(ErrorCode.DEVICE_NOT_OWNED);
            }

            // 이미 다른 식물에 연결된 디바이스인지 확인
            if (userPlantRepository.findConnectedPlantByDeviceId(deviceId).isPresent()) {
                throw new CustomException(ErrorCode.DEVICE_ALREADY_PAIRED);
            }

            // MQTT 발송 + ACK 대기 (실패 시 예외 발생, DB 저장 안함)
            deviceControlService.sendBindingBound(
                    device.getSerial(),
                    null,  // plantId는 아직 생성 전이므로 null
                    species.getSpeciesId()
            );

            // 디바이스에 식물 연결 상태 설정
            device.bindPlant();

            // 기존 main 식물이 있으면 해제
            userPlantRepository.findMainPlantByUserId(userId)
                    .ifPresent(UserPlant::changeMainFalse);

            shouldBeMain = true;
        }

        // DB 저장
        UserPlant userPlant = UserPlant.builder()
                .user(user)
                .species(species)
                .device(device)
                .plantName(plantName)
                .isMain(shouldBeMain)
                .build();

        userPlantRepository.save(userPlant);

        PlantStatus plantStatus = PlantStatus.builder()
                .userPlant(userPlant)
                .characterCode(0)
                .build();

        plantStatusRepository.save(plantStatus);

        return CreatePlantResponse.builder()
                .plantId(userPlant.getPlantId())
                .name(userPlant.getPlantName())
                .species(species.getSpeciesId())
                .deviceId(device != null ? device.getDeviceId() : null)
                .characterCode(0)
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
}
