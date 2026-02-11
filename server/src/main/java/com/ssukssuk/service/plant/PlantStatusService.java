package com.ssukssuk.service.plant;

import com.ssukssuk.domain.plant.CharacterCode;
import com.ssukssuk.domain.plant.PlantStatus;
import com.ssukssuk.event.PlantStatusUpdatedEvent;
import com.ssukssuk.infra.mqtt.dto.SensorUplinkMessage;
import com.ssukssuk.repository.plant.CharacterCodeRepository;
import com.ssukssuk.repository.plant.PlantStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlantStatusService {

    private final PlantStatusRepository plantStatusRepository;
    private final CharacterCodeRepository characterCodeRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * 센서 데이터로 PlantStatus 업데이트
     */
    @Transactional
    public void updateFromSensor(Long plantId, SensorUplinkMessage msg) {
        PlantStatus status = plantStatusRepository.findById(plantId).orElse(null);
        if (status == null) {
            log.warn("[PlantStatus] not found for plantId={}", plantId);
            return;
        }

        int newCharacterCode = status.updateFromSensor(
                msg.getTemperature(),
                msg.getHumidity(),
                convertStatus(msg.getTemperatureStatus()),
                convertStatus(msg.getHumidityStatus()),
                convertStatus(msg.getWaterLevelStatus()),
                convertStatus(msg.getNutrientConcStatus())
        );

        // 캐릭터 코드 업데이트
        characterCodeRepository.findById(newCharacterCode)
                .ifPresent(status::applyCharacter);

        eventPublisher.publishEvent(new PlantStatusUpdatedEvent(plantId));
    }

    /**
     * 이미지 데이터로 PlantStatus 업데이트
     */
    @Transactional
    public void updateFromImage(Long plantId, Double height, Double width, Integer anomaly) {
        PlantStatus status = plantStatusRepository.findById(plantId).orElse(null);
        if (status == null) {
            log.warn("[PlantStatus] not found for plantId={}", plantId);
            return;
        }

        int newCharacterCode = status.updateFromImage(height, width, anomaly);

        // 캐릭터 코드 업데이트
        characterCodeRepository.findById(newCharacterCode)
                .ifPresent(status::applyCharacter);

        eventPublisher.publishEvent(new PlantStatusUpdatedEvent(plantId));
    }

    /**
     * 안읽은 알림 표시
     */
    @Transactional
    public void markUnreadNotification(Long plantId) {
        PlantStatus status = plantStatusRepository.findById(plantId).orElse(null);
        if (status == null) {
            log.warn("[PlantStatus] not found for plantId={}", plantId);
            return;
        }

        status.markUnreadNotification();

        eventPublisher.publishEvent(new PlantStatusUpdatedEvent(plantId));
    }

    /**
     * 알림 읽음 처리 시 안읽은 알림 표시 해제
     */
    @Transactional
    public void clearUnreadNotification(Long plantId) {
        PlantStatus status = plantStatusRepository.findById(plantId).orElse(null);
        if (status == null) {
            log.warn("[PlantStatus] not found for plantId={}", plantId);
            return;
        }

        status.clearUnreadNotification();

        eventPublisher.publishEvent(new PlantStatusUpdatedEvent(plantId));
    }

    private PlantStatus.SensorStatusType convertStatus(SensorUplinkMessage.SensorStatus status) {
        if (status == null) return null;
        return switch (status) {
            case OK -> PlantStatus.SensorStatusType.OK;
            case UP -> PlantStatus.SensorStatusType.UP;
            case DOWN -> PlantStatus.SensorStatusType.DOWN;
        };
    }
}
