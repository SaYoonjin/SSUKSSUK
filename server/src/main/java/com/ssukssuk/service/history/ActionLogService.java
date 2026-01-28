package com.ssukssuk.service.history;

import com.ssukssuk.infra.mqtt.dto.ActionResultMessage;
import com.ssukssuk.domain.history.ActionLog;
import com.ssukssuk.domain.history.SensorEvent;
import com.ssukssuk.repository.history.ActionLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

public interface ActionLogService {
    void record(ActionResultMessage msg, SensorEvent event, LocalDateTime occurredAt);

    @Service
    @RequiredArgsConstructor
    class Impl implements ActionLogService {

        private final ActionLogRepository actionLogRepository;

        @Transactional
        @Override
        public void record(ActionResultMessage msg, SensorEvent event, LocalDateTime occurredAt) {

            ActionLog log = ActionLog.of(
                    event,
                    msg.getActionType(),
                    msg.getResultStatus(),
                    msg.getBeforeValue(),
                    msg.getAfterValue(),
                    msg.getErrorCode(),
                    msg.getErrorMessage(),
                    occurredAt != null ? occurredAt : LocalDateTime.now()
            );

            actionLogRepository.save(log);
        }
    }
}