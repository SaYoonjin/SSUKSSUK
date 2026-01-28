package com.ssukssuk.repository.plant;

import com.ssukssuk.domain.plant.UserPlant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserPlantRepository extends JpaRepository<UserPlant, Long> {

    // 유저의 모든 식물 조회 (삭제되지 않은 것만)
    List<UserPlant> findAllByUser_IdAndRemovedAtIsNull(Long userId);

    // 현재 메인 식물 조회
    Optional<UserPlant> findByUser_IdAndIsMainTrueAndRemovedAtIsNull(Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update UserPlant up
        set up.isMain = false
        where up.user.id = :userId
          and up.isMain = true
          and up.removedAt is null
    """)
    void clearMainPlant(@Param("userId") Long userId);

    @Query("""
        select (count(up) > 0)
        from UserPlant up
        where up.plantId = :plantId
          and up.removedAt is null
          and up.device.serial = :serial
          and up.isConnected = true
    """)
    boolean existsActiveBinding(
            @Param("plantId") Long plantId,
            @Param("serial") String serial
    );

    @Query("""
    select new com.ssukssuk.repository.plant.BindingProjection(
        d.serial,
        up.plantId
    )
    from UserPlant up
    join up.device d
    where up.removedAt is null
      and up.isConnected = true
""")
    List<BindingProjection> findAllActiveBindings();

    // plantId로 "현재 연결된(활성)" userId 찾기
    @Query("""
        select up.user.id
        from UserPlant up
        where up.plantId = :plantId
          and up.removedAt is null
          and up.isConnected = true
    """)
    Optional<Long> findActiveUserIdByPlantId(@Param("plantId") Long plantId);

    // 디바이스에 연결된 활성 식물 찾기
    @Query("""
        select up from UserPlant up
        where up.device.deviceId = :deviceId
          and up.removedAt is null
          and up.isConnected = true
    """)
    Optional<UserPlant> findConnectedPlantByDeviceId(@Param("deviceId") Long deviceId);

    // 특정 식물 조회 (소유자 검증용)
    @Query("""
        select up from UserPlant up
        where up.plantId = :plantId
          and up.user.id = :userId
          and up.removedAt is null
    """)
    Optional<UserPlant> findByPlantIdAndUserId(
            @Param("plantId") Long plantId,
            @Param("userId") Long userId
    );
}
