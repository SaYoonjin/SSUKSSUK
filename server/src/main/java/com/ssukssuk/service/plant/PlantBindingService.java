package com.ssukssuk.service.plant;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.device.Device;
import com.ssukssuk.domain.plant.UserPlant;
import com.ssukssuk.repository.device.DeviceRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import com.ssukssuk.service.device.DeviceControlService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
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
        log.debug("[bind] START: plantId={}, deviceId={}", plantId, deviceId);

        log.debug("[bind] plant 조회 시작");
        UserPlant plant = userPlantRepository.findById(plantId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));
        log.debug("[bind] plant 조회 완료: plantId={}, deviceId={}, isConnected={}",
                plant.getPlantId(),
                plant.getDevice() != null ? plant.getDevice().getDeviceId() : null,
                plant.getIsConnected());

        log.debug("[bind] device 조회 시작");
        Device newDevice = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new CustomException(ErrorCode.DEVICE_NOT_FOUND));
        log.debug("[bind] device 조회 완료: deviceId={}, serial={}, pairing={}",
                newDevice.getDeviceId(), newDevice.getSerial(), newDevice.getPairing());

        log.debug("[bind] species 접근 시작");
        Long speciesId = plant.getSpecies().getSpeciesId();
        log.debug("[bind] species 접근 완료: speciesId={}", speciesId);

        log.debug("[bind] MQTT sendBindingBound 호출 시작: serial={}, plantId={}, speciesId={}",
                newDevice.getSerial(), plant.getPlantId(), speciesId);
        deviceControlService.sendBindingBound(
                newDevice.getSerial(),
                plant.getPlantId(),
                speciesId
        );
        log.debug("[bind] MQTT sendBindingBound 호출 완료");

        plant.bindDevice(newDevice);
        newDevice.bindPlant();
        log.debug("[bind] 엔티티 바인딩 완료: plant.deviceId={}, plant.isConnected={}, device.pairing={}",
                plant.getDevice() != null ? plant.getDevice().getDeviceId() : null,
                plant.getIsConnected(),
                newDevice.getPairing());

        // 이 식물을 main으로 설정
        log.debug("[bind] user 접근 시작");
        Long userId = plant.getUser().getId();
        log.debug("[bind] user 접근 완료: userId={}", userId);

        userPlantRepository.findMainPlantByUserId(userId)
                .ifPresent(mainPlant -> {
                    log.debug("[bind] 기존 main 식물 해제: plantId={}", mainPlant.getPlantId());
                    mainPlant.changeMainFalse();
                });
        plant.changeMain(true);
        log.debug("[bind] END: plant.isMain={}", plant.isMain());
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
