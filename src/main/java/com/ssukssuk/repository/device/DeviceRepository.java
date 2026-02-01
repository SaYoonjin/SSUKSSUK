package com.ssukssuk.repository.device;

import com.ssukssuk.domain.device.Device;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DeviceRepository extends JpaRepository<Device, Long> {

    Optional<Device> findByDeviceIdAndUser_Id(Long deviceId, Long userId);

    Optional<Device> findBySerial(String serial);

    List<Device> findAllByUser_IdAndPairingTrue(Long userId);

    // 사용자의 모든 등록된 디바이스 조회 (pairing 여부 관계없이)
    List<Device> findAllByUser_Id(Long userId);
}