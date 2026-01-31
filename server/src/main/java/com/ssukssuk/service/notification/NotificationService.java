package com.ssukssuk.service.notification;

import com.ssukssuk.domain.auth.User;
import com.ssukssuk.domain.history.ImageInference;
import com.ssukssuk.domain.history.SensorEvent;
import com.ssukssuk.domain.notification.Notification;
import com.ssukssuk.domain.plant.UserPlant;
import com.ssukssuk.repository.auth.UserRepository;
import com.ssukssuk.repository.history.SensorEventRepository;
import com.ssukssuk.repository.notification.NotificationRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserPlantRepository userPlantRepository;
    private final UserRepository userRepository;
    private final SensorEventRepository sensorEventRepository;

    @Transactional
    public void notifySensorAnomaly(
            Long plantId,
            Long eventId,
            Notification.NotiTitle sensorTitle
    ) {
        UserPlant plant = findPlantById(plantId);
        User user = findActiveUserByPlantId(plantId);
        SensorEvent event = sensorEventRepository.findById(eventId).orElse(null);

        String message = sensorAnomalyMessage(sensorTitle);

        Notification n = Notification.of(
                user,
                plant,
                event,
                null,
                Notification.NotiType.SENSOR,
                sensorTitle,
                message
        );

        notificationRepository.save(n);
    }

    @Transactional
    public void notifyImageDiscoloration(UserPlant plant, ImageInference inference) {
        User user = findActiveUserByPlantId(plant.getPlantId());

        Notification n = Notification.of(
                user,
                plant,
                null,
                inference,
                Notification.NotiType.IMAGE,
                Notification.NotiTitle.DISCOLORATION,
                "잎 상태에 이상이 감지됐어요"
        );

        notificationRepository.save(n);
    }

    /**
     * 디바이스 자동 조치 완료 알림 생성
     * TODO: 이 메서드를 호출하는 곳에서 plantStatusService.markUnreadNotification(plantId)도 함께 호출해야 함
     *       (SensorTelemetryService의 ANOMALY_DETECTED, RECOVERY_DONE 처리 패턴 참고)
     */
    @Transactional
    public void notifyActionDone(
            Long plantId,
            Long eventId
    ) {
        UserPlant plant = findPlantById(plantId);
        User user = findActiveUserByPlantId(plantId);
        SensorEvent event = sensorEventRepository.findById(eventId).orElse(null);

        Notification n = Notification.of(
                user,
                plant,
                event,
                null,
                Notification.NotiType.ACTION_DONE,
                Notification.NotiTitle.ACTION_DONE,
                "이상 상태에 대한 자동 조치가 완료됐어요"
        );

        notificationRepository.save(n);
    }

    /**
     * 디바이스 자동 조치 실패 알림 생성
     * TODO: 이 메서드를 호출하는 곳에서 plantStatusService.markUnreadNotification(plantId)도 함께 호출해야 함
     *       (SensorTelemetryService의 ANOMALY_DETECTED, RECOVERY_DONE 처리 패턴 참고)
     */
    @Transactional
    public void notifyActionFail(
            Long plantId,
            Long eventId
    ) {
        UserPlant plant = findPlantById(plantId);
        User user = findActiveUserByPlantId(plantId);
        SensorEvent event = sensorEventRepository.findById(eventId).orElse(null);

        Notification n = Notification.of(
                user,
                plant,
                event,
                null,
                Notification.NotiType.ACTION_FAIL,
                Notification.NotiTitle.ACTION_FAIL,
                "이상 상태에 대한 자동 조치를 실패했어요"
        );

        notificationRepository.save(n);
    }

    @Transactional
    public void notifySensorRecovery(
            Long plantId,
            Long eventId,
            Notification.NotiTitle sensorTitle
    ) {
        UserPlant plant = findPlantById(plantId);
        User user = findActiveUserByPlantId(plantId);
        SensorEvent event = sensorEventRepository.findById(eventId)
                .orElse(null);

        String message = sensorRecoveryMessage(sensorTitle);

        Notification n = Notification.of(
                user,
                plant,
                event,
                null,
                Notification.NotiType.RECOVERY,
                sensorTitle,
                message
        );

        notificationRepository.save(n);
    }

    @Transactional
    public void create(Long plantId, Long eventId, String notiType, String message) {
        UserPlant plant = findPlantById(plantId);
        User user = findActiveUserByPlantId(plantId);
        SensorEvent event = eventId != null ? sensorEventRepository.findById(eventId).orElse(null) : null;

        ParsedNoti parsed = parseLegacyNotiType(notiType);

        Notification n = Notification.of(
                user,
                plant,
                event,
                null,
                parsed.notiType(),
                parsed.notiTitle(),
                message
        );

        notificationRepository.save(n);
    }

    private UserPlant findPlantById(Long plantId) {
        return userPlantRepository.findById(plantId)
                .orElseThrow(() -> new IllegalStateException("Plant not found: " + plantId));
    }

    private User findActiveUserByPlantId(Long plantId) {
        Long userId = userPlantRepository.findActiveUserIdByPlantId(plantId)
                .orElseThrow(() -> new IllegalStateException(
                        "No active user_plant binding for plantId=" + plantId
                ));
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found: " + userId));
    }

    private String sensorAnomalyMessage(Notification.NotiTitle title) {
        return switch (title) {
            case WATER_LEVEL -> "수위가 정상 범위를 벗어났어요";
            case TEMPERATURE -> "온도가 적정 범위를 벗어났어요";
            case NUTRIENT_CONC -> "영양분 농도가 정상 범위를 벗어났어요";
            case HUMIDITY -> "습도가 적정 범위를 벗어났어요";
            case ACTION_FAIL -> "이상 상태에 대한 자동 조치를 실패했어요";
            case DISCOLORATION, ACTION_DONE ->
                    throw new IllegalArgumentException("Invalid sensor title: " + title);
        };
    }

    private String sensorRecoveryMessage(Notification.NotiTitle title) {
        return switch (title) {
            case WATER_LEVEL -> "수위가 정상으로 돌아왔어요.";
            case NUTRIENT_CONC -> "영양분 농도가 정상 범위로 복구됐어요.";
            case HUMIDITY, TEMPERATURE, ACTION_FAIL, ACTION_DONE, DISCOLORATION ->
                    throw new IllegalArgumentException("Invalid sensor title: " + title);
        };
    }


    private ParsedNoti parseLegacyNotiType(String notiTypeRaw) {
        if (notiTypeRaw == null || notiTypeRaw.isBlank()) {
            throw new IllegalArgumentException("notiType must not be blank");
        }

        String key = notiTypeRaw.trim().toUpperCase(Locale.ROOT);

        if (key.endsWith("_ACTION_DONE")) {
            return new ParsedNoti(Notification.NotiType.ACTION_DONE, Notification.NotiTitle.ACTION_DONE);
        }

        return switch (key) {
            case "WATER_LEVEL" -> new ParsedNoti(Notification.NotiType.SENSOR, Notification.NotiTitle.WATER_LEVEL);
            case "TEMPERATURE" -> new ParsedNoti(Notification.NotiType.SENSOR, Notification.NotiTitle.TEMPERATURE);
            case "NUTRIENT_CONC" -> new ParsedNoti(Notification.NotiType.SENSOR, Notification.NotiTitle.NUTRIENT_CONC);
            case "HUMIDITY" -> new ParsedNoti(Notification.NotiType.SENSOR, Notification.NotiTitle.HUMIDITY);
            default -> throw new IllegalArgumentException("Unknown notiType: " + notiTypeRaw);
        };
    }

    private record ParsedNoti(Notification.NotiType notiType, Notification.NotiTitle notiTitle) {}
}