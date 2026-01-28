package com.ssukssuk.domain.history;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "action_log",
        indexes = {
                @Index(name = "idx_action_log_event_id", columnList = "event_id"),
                @Index(name = "idx_action_log_created_at", columnList = "created_at")
        }
)
public class ActionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "action_id")
    private Long actionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private SensorEvent event;

    // WATER_ADD / NUTRIENT_ADD (코드테이블 아직 없으니 문자열로 시작)
    @Column(name = "action_type", nullable = false, length = 30)
    private String actionType;

    @Column(name = "result_status", nullable = false, length = 20)
    private String resultStatus;

    @Column(name = "before_value")
    private Float beforeValue;

    @Column(name = "after_value")
    private Float afterValue;

    @Column(name = "error_code", length = 50)
    private String errorCode;

    @Column(name = "error_message", length = 255)
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public static ActionLog of(
            SensorEvent event,
            String actionType,
            String resultStatus,
            Float beforeValue,
            Float afterValue,
            String errorCode,
            String errorMessage,
            LocalDateTime createdAt
    ) {
        ActionLog a = new ActionLog();
        a.event = event;
        a.actionType = actionType;
        a.resultStatus = resultStatus;
        a.beforeValue = beforeValue;
        a.afterValue = afterValue;
        a.errorCode = errorCode;
        a.errorMessage = errorMessage;
        a.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        return a;
    }
}