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

    public DeviceClaimResponse claim(Long userId, String serial) {

        Device device = deviceRepository.findBySerial(serial)
                .orElseThrow(() -> new CustomException(ErrorCode.DEVICE_NOT_FOUND));

        // 이미 같은 유저에게 클레임된 경우 → 그대로 OK
        if (device.getUser() != null && device.getUser().getId().equals(userId)) {
            return DeviceClaimResponse.from(device);
        }

        // 이미 다른 유저에게 클레임된 경우
        if (Boolean.TRUE.equals(device.getPairing())) {
            throw new CustomException(ErrorCode.DEVICE_ALREADY_CLAIMED);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 1. MQTT 발송 + ACK 대기 (실패 시 예외 발생)
        deviceControlService.sendClaimUpdate(
                serial,
                userId,
                "CLAIMED",
                user.getMode().name()
        );

        // 2. ACK 성공 시 DB 저장
        device.claim(user);

        return DeviceClaimResponse.from(device);
    }

    public void unclaim(Long userId, Long deviceId) {

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new CustomException(ErrorCode.DEVICE_NOT_FOUND));

        // 클레임되지 않은 디바이스
        if (device.getUser() == null || !Boolean.TRUE.equals(device.getPairing())) {
            throw new CustomException(ErrorCode.DEVICE_NOT_CLAIMED);
        }

        // 다른 유저의 디바이스
        if (!device.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.DEVICE_NOT_OWNED);
        }

        String serial = device.getSerial();

        // 연결된 식물이 있으면 먼저 바인딩 해제
        userPlantRepository.findConnectedPlantByDeviceId(deviceId)
                .ifPresent(plant -> {
                    deviceControlService.sendBindingUnbound(serial);
                    plant.unbindDevice();
                });

        // 1. MQTT 발송 + ACK 대기 (실패 시 예외 발생)
        deviceControlService.sendClaimUpdate(
                serial,
                userId,
                "UNCLAIMED",
                null
        );

        // 2. ACK 성공 시 DB 업데이트
        device.unclaim();
    }

    @Transactional(readOnly = true)
    public List<DeviceResponse> getMyDevices(Long userId) {
        List<Device> devices = deviceRepository.findAllByUser_IdAndPairingTrue(userId);

        return devices.stream()
                .map(device -> {
                    // 이 디바이스에 연결된 식물 찾기
                    var connectedPlant = userPlantRepository
                            .findConnectedPlantByDeviceId(device.getDeviceId());

                    return DeviceResponse.builder()
                            .deviceId(device.getDeviceId())
                            .serial(device.getSerial())
                            .paired(true)
                            .plantConnected(connectedPlant.isPresent())
                            .connectedPlantId(connectedPlant.map(UserPlant::getPlantId).orElse(null))
                            .connectedPlantName(connectedPlant.map(UserPlant::getPlantName).orElse(null))
                            .build();
                })
                .toList();
    }
}
