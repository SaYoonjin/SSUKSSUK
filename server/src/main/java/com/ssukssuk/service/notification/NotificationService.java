package com.ssukssuk.service.notification;

import com.ssukssuk.domain.notification.Notification;
import com.ssukssuk.repository.notification.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

public interface NotificationService {

    void create(Long plantId, Long eventId, String notiType, String message);

    @Service
    @RequiredArgsConstructor
    class Impl implements NotificationService {

        private final NotificationRepository notificationRepository;

        @Transactional
        @Override
        public void create(Long plantId, Long eventId, String notiType, String message) {
            Notification n = Notification.create(plantId, eventId, notiType, message);
            notificationRepository.save(n);
        }
    }
}