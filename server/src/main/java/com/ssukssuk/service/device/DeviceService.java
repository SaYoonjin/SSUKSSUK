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

        Device device = deviceRepository.findByDeviceSerial(serial)
                .orElseThrow(() ->
                        new CustomException(ErrorCode.DEVICE_NOT_FOUND)
                );

        if (device.getUser() != null && device.getUser().getId().equals(userId)) {
            return DeviceClaimResponse.from(device);
        }

        if (Boolean.TRUE.equals(device.getPairing())) {
            if (device.getUser().getId().equals(userId)) {
                return DeviceClaimResponse.from(device);
            }
            throw new CustomException(ErrorCode.DEVICE_ALREADY_CLAIMED);
        }

        User user = userRepository.getReferenceById(userId);

        device.claim(user);

        return DeviceClaimResponse.from(device);
    }
}
