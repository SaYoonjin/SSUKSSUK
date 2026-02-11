package com.ssukssuk.repository.history;

import com.ssukssuk.domain.history.ActionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ActionLogRepository extends JpaRepository<ActionLog, Long> {

    Optional<ActionLog> findTopByEvent_EventIdAndResultStatusOrderByCreatedAtDesc(
            Long eventId,
            String resultStatus
    );
}