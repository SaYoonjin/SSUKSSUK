package com.ssukssuk.service.device;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.auth.User;
import com.ssukssuk.domain.device.Device;
import com.ssukssuk.dto.device.DeviceClaimResponse;
import com.ssukssuk.repository.auth.UserRepository;
import com.ssukssuk.repository.device.DeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;

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

        // 최초 클레임
        User user = userRepository.getReferenceById(userId);
        device.claim(user); // pairing = true, claimed_at 설정

        return DeviceClaimResponse.from(device);
    }
}
