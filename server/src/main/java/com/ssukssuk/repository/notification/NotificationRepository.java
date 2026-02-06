package com.ssukssuk.repository.notification;

import com.ssukssuk.domain.notification.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * 오늘 알림 리스트 조회 (createdAt: [start, end))
     */
    @Query("""
        select n
        from Notification n
        where n.user.id = :userId
          and n.createdAt >= :start
          and n.createdAt < :end
        order by n.createdAt desc
    """)
    List<Notification> findTodayByUserId(
            @Param("userId") Long userId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    /**
     * 미읽음 알림 전체 읽음 처리 (readAt이 null인 것만)
     * @return 업데이트된 row 수 = updatedCount
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update Notification n
        set n.readAt = :now
        where n.user.id = :userId
          and n.readAt is null
    """)
    int markAllReadByUserId(
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now
    );

    /**
     * 특정 식물의 오늘 알림 리스트 조회 (createdAt: [start, end))
     */
    @Query("""
        select n
        from Notification n
        where n.plant.plantId = :plantId
          and n.createdAt >= :start
          and n.createdAt < :end
        order by n.createdAt desc
    """)
    List<Notification> findTodayByPlantId(
            @Param("plantId") Long plantId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    /**
     * 특정 식물의 미읽음 알림 전체 읽음 처리
     * @return 업데이트된 row 수 = updatedCount
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update Notification n
        set n.readAt = :now
        where n.plant.plantId = :plantId
          and n.readAt is null
    """)
    int markAllReadByPlantId(
            @Param("plantId") Long plantId,
            @Param("now") LocalDateTime now
    );
}