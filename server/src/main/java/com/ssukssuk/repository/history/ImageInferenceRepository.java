package com.ssukssuk.repository.history;

import com.ssukssuk.domain.history.ImageInference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ImageInferenceRepository
        extends JpaRepository<ImageInference, Long> {

    @Query(value = """
        SELECT DATE(ii.inference_at) AS d,
               ii.height AS height,
               ii.width AS width
        FROM image_inference ii
        JOIN (
            SELECT DATE(inference_at) AS d,
                   MAX(inference_at) AS max_at
            FROM image_inference
            WHERE plant_id = :plantId
              AND inference_at >= :start
              AND inference_at <  :endExclusive
            GROUP BY DATE(inference_at)
        ) t
          ON DATE(ii.inference_at) = t.d
         AND ii.inference_at = t.max_at
        WHERE ii.plant_id = :plantId
        ORDER BY d
        """, nativeQuery = true)
    List<DailyHeightRow> findDailyLastHeight(
            @Param("plantId") Long plantId,
            @Param("start") LocalDateTime start,
            @Param("endExclusive") LocalDateTime endExclusive
    );
}