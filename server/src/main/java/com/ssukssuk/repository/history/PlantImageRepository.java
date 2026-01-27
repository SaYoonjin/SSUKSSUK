package com.ssukssuk.repository.history;

import com.ssukssuk.domain.history.PlantImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PlantImageRepository extends JpaRepository<PlantImage, Long> {

    @Query("""
        select pi
        from PlantImage pi
        where pi.plantId = :plantId
          and pi.capturedAt = (
              select max(p2.capturedAt)
              from PlantImage p2
              where p2.plantId = :plantId
                and p2.cameraPosition = pi.cameraPosition
          )
    """)
    List<PlantImage> findLatestImagesByPlantId(
            @Param("plantId") Long plantId
    );

    @Query("""
        select max(pi.capturedAt)
        from PlantImage pi
        where pi.plantId = :plantId
    """)
    LocalDateTime findLatestCapturedAt(
            @Param("plantId") Long plantId
    );
}


