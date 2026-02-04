package com.ssukssuk.service.plant;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.device.Device;
import com.ssukssuk.domain.plant.PlantStatus;
import com.ssukssuk.domain.plant.UserPlant;
import com.ssukssuk.dto.plant.CreatePlantResponse;
import com.ssukssuk.dto.plant.MyPlantResponse;
import com.ssukssuk.dto.plant.UpdatePlantRequest;
import com.ssukssuk.repository.device.DeviceRepository;
import com.ssukssuk.repository.plant.PlantStatusRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import com.ssukssuk.service.s3.UploadUrlPublishService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserPlantService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final DeviceRepository deviceRepository;
    private final UserPlantRepository userPlantRepository;
    private final PlantBindingService plantBindingService;
    private final PlantCreationService plantCreationService;
    private final UploadUrlPublishService uploadUrlPublishService;
    private final PlantStatusRepository plantStatusRepository;

    /**
     * 식물 생성 + 디바이스 바인딩
     * - 식물 생성은 별도 트랜잭션으로 먼저 커밋 (plantId 확보)
     * - 바인딩은 그 후 별도 트랜잭션으로 시도
     */
    public CreatePlantResponse createPlant(
            Long userId,
            Long speciesId,
            Long deviceId,
            String plantName
    ) {

        // 1. 식물 생성 (별도 트랜잭션으로 즉시 커밋 → plantId 확보)
        UserPlant userPlant = plantCreationService.createPlantOnly(userId, speciesId, plantName);

        // 2. 디바이스가 있으면 바인딩 시도
        String bindingError = null;
        Long boundDeviceId = null;

        if (deviceId != null) {
            try {
                // 바인딩 (별도 트랜잭션으로 MQTT + DB)
                plantBindingService.bindWithValidation(userId, userPlant.getPlantId(), deviceId);
                boundDeviceId = deviceId;

                // 바인딩 성공 시 즉시 초기 이미지 URL 발급
                Device device = deviceRepository.findById(deviceId)
                        .orElseThrow(() -> new CustomException(ErrorCode.DEVICE_NOT_FOUND));
                uploadUrlPublishService.publishUploadUrl(
                        device.getSerial(),
                        userPlant.getPlantId(),
                        LocalDate.now(KST),
                        "INIT"
                );
                log.info("[createPlant] Published initial upload URL: plantId={}, deviceId={}",
                        userPlant.getPlantId(), deviceId);
            } catch (Exception e) {
                // 바인딩 실패 시 에러 메시지 저장 (식물은 유지)
                bindingError = e.getMessage();
            }
        }

        return CreatePlantResponse.builder()
                .plantId(userPlant.getPlantId())
                .name(userPlant.getPlantName())
                .species(userPlant.getSpecies().getSpeciesId())
                .deviceId(boundDeviceId)
                .characterCode(0)
                .bindingError(bindingError)
                .build();
    }

    public void updatePlant(Long userId, Long plantId, UpdatePlantRequest request) {
        log.debug("[updatePlant] START: userId={}, plantId={}, request.deviceId={}", userId, plantId, request.getDeviceId());

        UserPlant plant = userPlantRepository.findByPlantIdAndUserId(plantId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));

        log.debug("[updatePlant] plant 조회 완료: plantId={}, speciesId={}, deviceId={}, isConnected={}",
                plant.getPlantId(),
                plant.getSpecies() != null ? plant.getSpecies().getSpeciesId() : null,
                plant.getDevice() != null ? plant.getDevice().getDeviceId() : null,
                plant.getIsConnected());

        // 이름 변경은 REQUIRES_NEW 트랜잭션 이후에 적용 (Lock 충돌 방지)
        String newName = request.getName();

        // 1. 디바이스 처리
        Device currentDevice = plant.getDevice();
        Long newDeviceId = request.getDeviceId();
        boolean isCurrentlyConnected = currentDevice != null && Boolean.TRUE.equals(plant.getIsConnected());
        log.debug("[updatePlant] 디바이스 처리 시작: currentDeviceId={}, newDeviceId={}, isCurrentlyConnected={}",
                currentDevice != null ? currentDevice.getDeviceId() : null, newDeviceId, isCurrentlyConnected);

        // 1-1. deviceId: null → 연결 해제
        if (newDeviceId == null) {
            if (isCurrentlyConnected) {
                // MQTT unbind → ACK 성공 시 별도 트랜잭션에서 즉시 커밋
                plantBindingService.unbind(plantId);
                // 현재 트랜잭션의 엔티티도 동기화 (JPA 덮어쓰기 방지)
                plant.unbindDevice();
                currentDevice.unbindPlant();
            }
            // 이름 변경 적용 후 종료
            if (newName != null && !newName.isBlank()) {
                plant.changeName(newName);
            }
            return;
        }

        // 1-2. 같은 디바이스면 이름만 변경
        if (currentDevice != null && currentDevice.getDeviceId().equals(newDeviceId)) {
            if (newName != null && !newName.isBlank()) {
                plant.changeName(newName);
            }
            return;
        }

        // 2-3. 새 디바이스로 변경
        Device newDevice = deviceRepository.findById(newDeviceId)
                .orElseThrow(() -> new CustomException(ErrorCode.DEVICE_NOT_FOUND));

        // 새 디바이스 소유자 검증
        if (newDevice.getUser() == null || !newDevice.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.DEVICE_NOT_OWNED);
        }

        // 새 디바이스가 이미 다른 식물에 연결되어 있는지 확인
        Optional<UserPlant> existingPlant = userPlantRepository.findConnectedPlantByDeviceId(newDeviceId);
        if (existingPlant.isPresent() && !existingPlant.get().getPlantId().equals(plantId)) {
            throw new CustomException(ErrorCode.DEVICE_ALREADY_PAIRED);
        }

        // 기존 디바이스 연결 해제 (MQTT unbind → ACK 성공 시 별도 트랜잭션에서 즉시 커밋)
        if (isCurrentlyConnected) {
            log.debug("[updatePlant] unbind 호출 전: plantId={}, currentDeviceId={}", plantId, currentDevice.getDeviceId());
            plantBindingService.unbind(plantId);
            log.debug("[updatePlant] unbind 호출 후 (REQUIRES_NEW 커밋됨)");
            // 현재 트랜잭션의 엔티티도 동기화 (JPA 덮어쓰기 방지)
            plant.unbindDevice();
            currentDevice.unbindPlant();
            log.debug("[updatePlant] 엔티티 동기화 후: plant.deviceId={}, plant.isConnected={}, currentDevice.pairing={}",
                    plant.getDevice() != null ? plant.getDevice().getDeviceId() : null,
                    plant.getIsConnected(),
                    currentDevice.getPairing());
        }

        // 새 디바이스 연결 (MQTT bind → ACK 성공 시 별도 트랜잭션에서 즉시 커밋)
        log.debug("[updatePlant] bind 호출 전: plantId={}, newDeviceId={}", plantId, newDeviceId);
        plantBindingService.bind(plantId, newDeviceId);
        log.debug("[updatePlant] bind 호출 후 (REQUIRES_NEW 커밋됨)");
        // 현재 트랜잭션의 엔티티도 동기화 (JPA 덮어쓰기 방지)
        plant.bindDevice(newDevice);
        newDevice.bindPlant();

        // 2. 이름 변경 (REQUIRES_NEW 트랜잭션 이후에 적용)
        if (newName != null && !newName.isBlank()) {
            plant.changeName(newName);
        }

        log.debug("[updatePlant] END: plant.deviceId={}, plant.isConnected={}, newDevice.pairing={}",
                plant.getDevice() != null ? plant.getDevice().getDeviceId() : null,
                plant.getIsConnected(),
                newDevice.getPairing());
    }

    public List<MyPlantResponse> getMyPlants(Long userId) {

        // 해당 유저가 키우는 모든 식물 조회
        List<UserPlant> userPlants =
                userPlantRepository.findAllByUserIdWithJoin(userId);

        return userPlants.stream()
                .map(plant -> {

                    PlantStatus status =
                            plantStatusRepository.findById(plant.getPlantId())
                                    .orElse(null);

                    return MyPlantResponse.from(plant, status);
                })
                .toList();
    }

    @Transactional
    public void deletePlant(Long userId, Long plantId) {

        UserPlant plant = userPlantRepository.findByPlantIdAndUserId(plantId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));

        boolean connected = Boolean.TRUE.equals(plant.getIsConnected());

        // 디바이스가 연결돼 있으면 먼저 언바인드
        if (connected) {
            plantBindingService.unbind(plantId);
        }

        // - removedAt 설정
        // - isMain = false
        // - isConnected = false
        // - device = null
        plant.remove();
    }

    @Transactional
    public void unbindPlantDevice(Long userId, Long plantId) {

        UserPlant plant = userPlantRepository.findByPlantIdAndUserId(plantId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));

        Device device = plant.getDevice();
        if (device == null) {
            return; // 이미 연결된 디바이스가 없으면 무시
        }

        // MQTT 전송 후 DB 반영 (별도 트랜잭션)
        plantBindingService.unbind(plantId);
        // 현재 트랜잭션 엔티티도 동기화
        plant.unbindDevice();
    }

    @Transactional
    public void switchMainPlant(Long userId, Long plantId) {

        // 1. 요청 plant 조회 (본인 + 삭제 안 된 식물)
        UserPlant targetPlant =
                userPlantRepository.findByPlantIdAndUser_IdAndRemovedAtIsNull(plantId, userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.PLANT_NOT_FOUND));

        // 2. 이미 메인이면 그대로 종료
        if (targetPlant.isMain()) return;

        // 3. 기존 메인 식물 있으면 해제
        userPlantRepository
                .findByUser_IdAndIsMainTrueAndRemovedAtIsNull(userId)
                .ifPresent(mainPlant -> mainPlant.changeMain(false));

        // 4. 현재 식물 메인 설정
        targetPlant.changeMain(true);
    }


}
