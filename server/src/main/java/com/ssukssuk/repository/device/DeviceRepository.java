package com.ssukssuk.repository.device;

import com.ssukssuk.domain.device.Device;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;

public interface DeviceRepository extends JpaRepository<Device, Long> {

    Optional<Device> findByDeviceIdAndUser_Id(Long deviceId, Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Device> findByDeviceSerial(String deviceSerial);
}