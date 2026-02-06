package com.ssukssuk.service.device;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.auth.User;
import com.ssukssuk.domain.device.Device;
import com.ssukssuk.domain.plant.UserPlant;
import com.ssukssuk.repository.auth.UserRepository;
import com.ssukssuk.repository.device.DeviceRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DeviceClaimService {

    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final UserPlantRepository userPlantRepository;
    private final DeviceControlService deviceControlService;

    /**
     * 디바이스 claim (별도 트랜잭션)
     * MQTT 성공 시 DB 즉시 커밋
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void claim(Long deviceId, User user) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new CustomException(ErrorCode.DEVICE_NOT_FOUND));

        // REQUIRES_NEW 트랜잭션이므로 user를 다시 조회
        User managedUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        deviceControlService.sendClaimUpdate(
                device.getSerial(),
                managedUser.getId(),
                "CLAIMED",
                managedUser.getMode().name()
        );

        device.claim(managedUser);

        // 디바이스 등록 시 사용자 초기화 완료 처리
        if (!managedUser.isInitialized()) {
            managedUser.markInitialized();
        }
    }

    /**
     * 디바이스 unclaim (별도 트랜잭션)
     * MQTT는 unclaim 하나만 보내면 디바이스에서 식물 해제까지 자동 처리
     * DB는 식물 unbind + 디바이스 unclaim 둘 다 반영
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void unclaim(Long deviceId, Long userId, Long connectedPlantId) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new CustomException(ErrorCode.DEVICE_NOT_FOUND));

        // MQTT는 unclaim 하나만 전송
        deviceControlService.sendClaimUpdate(
                device.getSerial(),
                userId,
                "UNCLAIMED",
                null
        );

        // DB: 연결된 식물이 있으면 unbind 처리 (새 트랜잭션에서 다시 조회)
        if (connectedPlantId != null) {
            userPlantRepository.findById(connectedPlantId)
                    .ifPresent(UserPlant::unbindDevice);
            device.unbindPlant();
        }

        // DB: 디바이스 unclaim
        device.unclaim();
    }
}
