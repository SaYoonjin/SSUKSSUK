package com.ssukssuk.repository.push;

import com.ssukssuk.domain.push.PushToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PushTokenRepository extends JpaRepository<PushToken, Long> {

    Optional<PushToken> findByDeviceId(String deviceId);

    List<PushToken> findAllByUserId(Long userId);

    @Modifying
    @Query("""
        update PushToken pt
        set pt.notiSetting = :notiSetting
        where pt.deviceId = :deviceId
    """)
    int updateNotiSettingByDeviceId(
            @Param("deviceId") String deviceId,
            @Param("notiSetting") boolean notiSetting
    );
}
