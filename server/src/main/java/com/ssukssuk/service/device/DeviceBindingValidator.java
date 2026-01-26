package com.ssukssuk.service.device;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.device.Device;
import com.ssukssuk.repository.device.DeviceRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DeviceBindingValidator {

    private final DeviceRepository deviceRepository;
    private final UserPlantRepository userPlantRepository;

    /**
     * MQTT 센서 텔레메트리 수신 시
     * 디바이스 ↔ 식물 바인딩 검증
     *
     * @param serial  디바이스 시리얼 번호
     * @param plantId 메시지에 포함된 plantId
     */
    public void validate(String serial, Long plantId) {

        // 1️⃣ 디바이스 존재 여부 (serial 기준)
        Device device = deviceRepository.findBySerial(serial)
                .orElseThrow(() ->
                        new CustomException(ErrorCode.DEVICE_NOT_FOUND)
                );

        // 2️⃣ 디바이스가 아직 클레임되지 않은 경우
        if (device.getUser() == null) {
            throw new CustomException(ErrorCode.DEVICE_NOT_CLAIMED);
        }

        // 3️⃣ 이미 식물에 페어링된 디바이스
        if (!Boolean.TRUE.equals(device.getPairing())) {
            throw new CustomException(ErrorCode.DEVICE_ALREADY_PAIRED);
        }

        // 4️⃣ plantId 유효성 검증
        if (!userPlantRepository.existsById(plantId)) {
            throw new CustomException(ErrorCode.PLANT_NOT_FOUND);
        }
    }
}
