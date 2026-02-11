package com.ssukssuk.repository.plant;

import com.ssukssuk.domain.plant.UserPlant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserPlantRepository extends JpaRepository<UserPlant, Long> {

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

    // 요청 plant 조회 (본인 + 삭제 안 된 식물)
    Optional<UserPlant> findByPlantIdAndUser_IdAndRemovedAtIsNull(
            Long plantId, Long userId
    );

    // 현재 메인 식물 조회
    Optional<UserPlant> findByUser_IdAndIsMainTrueAndRemovedAtIsNull(
            Long userId
    );

    // 사용자의 활성 식물-디바이스 연결 조회 (모드 변경 시 MQTT 전송용)
    @Query("""
        select up from UserPlant up
        join fetch up.device d
        where up.user.id = :userId
          and up.removedAt is null
          and up.isConnected = true
    """)
    List<UserPlant> findActiveConnectionsByUserId(@Param("userId") Long userId);

    @Query("""
        select (count(up) > 0)
        from UserPlant up
        where up.plantId = :plantId
          and up.user.id = :userId
          and up.removedAt is null
    """)
    boolean existsByPlantIdAndUserId(
            @Param("plantId") Long plantId,
            @Param("userId") Long userId
    );

    // 사용자의 현재 main 식물 조회
    @Query("""
        select up from UserPlant up
        where up.user.id = :userId
          and up.removedAt is null
          and up.isMain = true
    """)
    Optional<UserPlant> findMainPlantByUserId(@Param("userId") Long userId);

    // 사용자의 모든 활성 식물 조회 (species/device fetch join으로 N+1 방지)
    @Query("""
        select up
        from UserPlant up
        join fetch up.species s
        left join fetch up.device d
        where up.user.id = :userId
          and up.removedAt is null
    """)
    List<UserPlant> findAllByUserIdWithJoin(@Param("userId") Long userId);

    // 종 수위 적정치 조회 (삭제된 식물 제외)
    @Query("""
        select s.waterMin
        from UserPlant up
        join up.species s
        where up.plantId = :plantId
          and up.removedAt is null
    """)
    Optional<Float> findWaterMinByPlantId(@Param("plantId") Long plantId);

    @Query("""
        select s.waterMax
        from UserPlant up
        join up.species s
        where up.plantId = :plantId
          and up.removedAt is null
    """)
    Optional<Float> findWaterMaxByPlantId(@Param("plantId") Long plantId);

    // 종 농도 적정치 조회 (삭제된 식물 제외)
    @Query("""
        select s.ecMin
        from UserPlant up
        join up.species s
        where up.plantId = :plantId
          and up.removedAt is null
    """)
    Optional<Float> findNutrientMinByPlantId(@Param("plantId") Long plantId);

    @Query("""
        select s.ecMax
        from UserPlant up
        join up.species s
        where up.plantId = :plantId
          and up.removedAt is null
    """)
    Optional<Float> findNutrientMaxByPlantId(@Param("plantId") Long plantId);

}