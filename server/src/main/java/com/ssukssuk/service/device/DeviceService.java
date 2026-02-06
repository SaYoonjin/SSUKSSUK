package com.ssukssuk.service.device;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.auth.User;
import com.ssukssuk.domain.device.Device;
import com.ssukssuk.domain.plant.UserPlant;
import com.ssukssuk.dto.device.DeviceClaimResponse;
import com.ssukssuk.dto.device.DeviceResponse;
import com.ssukssuk.repository.auth.UserRepository;
import com.ssukssuk.repository.device.DeviceRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import com.ssukssuk.service.plant.PlantBindingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final UserPlantRepository userPlantRepository;
    private final DeviceControlService deviceControlService;
    private final DeviceClaimService deviceClaimService;
    private final PlantBindingService plantBindingService;

    public DeviceClaimResponse claim(Long userId, String serial) {

        Device device = deviceRepository.findBySerial(serial)
                .orElseThrow(() -> new CustomException(ErrorCode.DEVICE_NOT_FOUND));

        // 이미 같은 유저에게 클레임된 경우 → 그대로 OK
        if (device.getUser() != null && device.getUser().getId().equals(userId)) {
            return DeviceClaimResponse.from(device);
        }

        // 이미 다른 유저에게 클레임된 경우 (user_id가 있으면 이미 등록됨)
        if (device.getUser() != null) {
            throw new CustomException(ErrorCode.DEVICE_ALREADY_CLAIMED);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 별도 트랜잭션으로 MQTT + DB 처리
        deviceClaimService.claim(device.getDeviceId(), user);

        return DeviceClaimResponse.from(device);
    }

    public void unclaim(Long userId, Long deviceId) {

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new CustomException(ErrorCode.DEVICE_NOT_FOUND));

        // 클레임되지 않은 디바이스 (user가 없으면 등록되지 않은 것)
        if (device.getUser() == null) {
            throw new CustomException(ErrorCode.DEVICE_NOT_CLAIMED);
        }

        // 다른 유저의 디바이스
        if (!device.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.DEVICE_NOT_OWNED);
        }

        // MQTT는 unclaim 하나만 보내면 디바이스에서 식물 해제까지 자동 처리
        // DB는 unbind + unclaim 둘 다 반영 필요
        Long connectedPlantId = userPlantRepository.findConnectedPlantByDeviceId(deviceId)
                .map(UserPlant::getPlantId)
                .orElse(null);

        // 별도 트랜잭션으로 MQTT + DB 처리
        deviceClaimService.unclaim(deviceId, userId, connectedPlantId);
    }

    @Transactional(readOnly = true)
    public List<DeviceResponse> getMyDevices(Long userId) {
        // 사용자의 모든 등록된 디바이스 조회 (pairing 여부 관계없이)
        List<Device> devices = deviceRepository.findAllByUser_Id(userId);

        return devices.stream()
                .map(device -> {
                    // 이 디바이스에 연결된 식물 찾기
                    var connectedPlant = userPlantRepository
                            .findConnectedPlantByDeviceId(device.getDeviceId());

                    return DeviceResponse.builder()
                            .deviceId(device.getDeviceId())
                            .serial(device.getSerial())
                            .paired(Boolean.TRUE.equals(device.getPairing()))
                            .plantConnected(connectedPlant.isPresent())
                            .connectedPlantId(connectedPlant.map(UserPlant::getPlantId).orElse(null))
                            .connectedPlantName(connectedPlant.map(UserPlant::getPlantName).orElse(null))
                            .build();
                })
                .toList();
    }
}
