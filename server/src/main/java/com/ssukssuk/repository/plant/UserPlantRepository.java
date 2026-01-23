package com.ssukssuk.repository.plant;

import com.ssukssuk.domain.plant.UserPlant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserPlantRepository extends JpaRepository<UserPlant, Long> {

    // 유저의 모든 식물 조회
    List<UserPlant> findAllByUser_IdAndRemovedAtIsNull(Long userId);

    // 현재 메인 식물 조회
    Optional<UserPlant> findByUser_IdAndIsMainTrueAndRemovedAtIsNull(Long userId);
}