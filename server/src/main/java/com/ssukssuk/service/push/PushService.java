package com.ssukssuk.service.push;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MessagingErrorCode;
import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.notification.Notification;
import com.ssukssuk.domain.push.PushToken;
import com.ssukssuk.dto.push.PushTokenRequest;
import com.ssukssuk.dto.push.PushTokenResponse;
import com.ssukssuk.repository.notification.NotificationRepository;
import com.ssukssuk.repository.push.PushTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PushService {

    private final PushTokenRepository pushTokenRepository;
    private final NotificationRepository notificationRepository;

    @Transactional
    public PushTokenResponse registerToken(
            PushTokenRequest request
    ) {
        // 유저가 이 기기에서 이미 토큰 등록했는지 조회
        PushToken token = pushTokenRepository
                .findByDeviceId(request.getMobileDeviceId())
                .map(existing -> {
                    existing.updateToken(request.getToken());
                    return existing;
                })
                .orElseGet(() ->
                        PushToken.builder()
                                .deviceId(request.getMobileDeviceId())
                                .platform(request.getPlatform())
                                .token(request.getToken())
                                .notiSetting(true)
                                .build()
                );


        pushTokenRepository.save(token);

        return PushTokenResponse.from(token);
    }

    public void sendNotification(Long notificationId) {

        Notification notification =
                notificationRepository.findById(notificationId)
                        .orElse(null);

        // user_id 기준 모든 토큰 조회
        List<PushToken> tokens =
                pushTokenRepository.findAllByUserId(notification.getUser().getId());

        // 토큰 개수만큼 FCM 전송
        for (PushToken token : tokens) {
            try {
                sendFcm(notification, token.getToken());
                log.warn("FCM success. notiId={}, token={}",
                        notificationId, token.getToken());

            } catch (FirebaseMessagingException e) {

                // INVALID 토큰이면 삭제
                if (isInvalidToken(e)) {
                    pushTokenRepository.delete(token);
                } else {
                    // 나머지는 로그 남김
                    log.warn("FCM send failed. notiId={}, token={}",
                            notificationId, token.getToken(), e);
                }
            }
        }
    }

    // 실제 FCM 전송
    private void sendFcm(Notification notification, String token)
            throws FirebaseMessagingException {

        Message message = Message.builder()
                .setToken(token)
                .setNotification(
                        com.google.firebase.messaging.Notification.builder()
                                .setTitle("SSUKSSUK 알림")
                                .setBody(notification.getMessage())
                                .build()
                )

                .putData("notificationId",
                        String.valueOf(notification.getNotificationId()))
                .build();

        FirebaseMessaging.getInstance().send(message);
    }

    // INVALID 토큰 판별 (앱 삭제, 토큰 만료 등)
    private boolean isInvalidToken(FirebaseMessagingException e) {
        return e.getMessagingErrorCode()
                == MessagingErrorCode.UNREGISTERED;
    }

    @Transactional
    public void updateNotiSetting(
            Long userId,
            String deviceId,
            boolean notiSetting) {

        pushTokenRepository.updateNotiSettingByDeviceId(
                deviceId,
                notiSetting
        );
    }
}