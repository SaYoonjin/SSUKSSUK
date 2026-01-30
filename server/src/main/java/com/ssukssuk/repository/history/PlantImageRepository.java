package com.ssukssuk.repository.history;

import com.ssukssuk.domain.history.PlantImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PlantImageRepository extends JpaRepository<PlantImage, Long> {

    /**
     * 특정 식물의 최근 기간 이미지 조회
     * - from <= capturedAt < to
     * - 최신순 정렬
     */
    @Query("""
        select pi
        from PlantImage pi
        where pi.plant.plantId = :plantId
          and pi.capturedAt >= :from
          and pi.capturedAt < :to
        order by pi.capturedAt desc
    """)
    List<PlantImage> findRecentImagesByPlantId(
            @Param("plantId") Long plantId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}