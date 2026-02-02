package com.ssukssuk.service.plant;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.device.Device;
import com.ssukssuk.domain.plant.UserPlant;
import com.ssukssuk.repository.device.DeviceRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import com.ssukssuk.service.device.DeviceControlService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PlantBindingService {

    private final DeviceControlService deviceControlService;
    private final UserPlantRepository userPlantRepository;
    private final DeviceRepository deviceRepository;

    /**
     * 식물-디바이스 연결 해제 (별도 트랜잭션)
     * MQTT 성공 시 DB 즉시 커밋
     * - plant.isConnected = false
     * - device.pairing = false
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void unbind(Long plantId) {
        UserPlant plant = userPlantRepository.findById(plantId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));

        Device device = plant.getDevice();
        if (device == null) {
            return;
        }

        deviceControlService.sendBindingUnbound(device.getSerial());
        plant.unbindDevice();
        device.unbindPlant();
    }

    /**
     * 식물-디바이스 연결 (별도 트랜잭션)
     * MQTT 성공 시 DB 즉시 커밋
     * - plant.isConnected = true, plant.device = newDevice
     * - device.pairing = true
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void bind(Long plantId, Long deviceId) {
        UserPlant plant = userPlantRepository.findById(plantId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));

        Device newDevice = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new CustomException(ErrorCode.DEVICE_NOT_FOUND));

        deviceControlService.sendBindingBound(
                newDevice.getSerial(),
                plant.getPlantId(),
                plant.getSpecies().getSpeciesId()
        );
        plant.bindDevice(newDevice);
        newDevice.bindPlant();

        // 이 식물을 main으로 설정
        userPlantRepository.findMainPlantByUserId(plant.getUser().getId())
                .ifPresent(UserPlant::changeMainFalse);
        plant.changeMain(true);
    }

    /**
     * 식물-디바이스 연결 (검증 포함)
     * - 디바이스 소유권 검증
     * - 디바이스 중복 연결 검증
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void bindWithValidation(Long userId, Long plantId, Long deviceId) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new CustomException(ErrorCode.DEVICE_NOT_FOUND));

        // 디바이스 소유자 검증
        if (device.getUser() == null || !device.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.DEVICE_NOT_OWNED);
        }

        // 이미 다른 식물에 연결된 디바이스인지 확인
        if (userPlantRepository.findConnectedPlantByDeviceId(deviceId).isPresent()) {
            throw new CustomException(ErrorCode.DEVICE_ALREADY_PAIRED);
        }

        bind(plantId, deviceId);
    }
}
