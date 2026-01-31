package com.ssukssuk.repository.push;

import com.ssukssuk.domain.push.PushToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PushTokenRepository extends JpaRepository<PushToken, Long> {

    Optional<PushToken> findByDeviceId(String deviceId);

    List<PushToken> findAllByUserId(Long userId);
}
