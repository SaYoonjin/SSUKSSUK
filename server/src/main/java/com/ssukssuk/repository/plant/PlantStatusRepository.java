package com.ssukssuk.repository.plant;

import com.ssukssuk.domain.plant.PlantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PlantStatusRepository
        extends JpaRepository<PlantStatus, Long> {

    @Query("""
        select ps from PlantStatus ps
        join fetch ps.userPlant up
        where up.user.id = :userId
          and up.isMain = true
          and up.removedAt is null
    """)
    Optional<PlantStatus> findMainPlantStatusByUserId(@Param("userId") Long userId);
}