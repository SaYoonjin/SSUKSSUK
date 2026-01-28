package com.ssukssuk.service.s3;

import com.ssukssuk.repository.plant.BindingProjection;
import com.ssukssuk.repository.plant.UserPlantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class UploadUrlScheduler {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final UserPlantRepository userPlantRepository;
    private final UploadUrlPublishService uploadUrlPublishService;

    @Scheduled(cron = "0 0 6 * * *", zone = "Asia/Seoul")
    public void scheduleMorning() {
        log.info("[UploadUrlScheduler] Morning batch started (06:00 KST)");
        publishToAllConnectedPlants("0600");
    }

    @Scheduled(cron = "0 0 18 * * *", zone = "Asia/Seoul")
    public void scheduleEvening() {
        log.info("[UploadUrlScheduler] Evening batch started (18:00 KST)");
        publishToAllConnectedPlants("1800");
    }

    public void publishToAllConnectedPlants(String slot) {
        LocalDate today = LocalDate.now(KST);
        List<BindingProjection> bindings = userPlantRepository.findAllActiveBindings();

        log.info("[UploadUrlScheduler] Found {} active bindings for slot={}", bindings.size(), slot);

        for (BindingProjection binding : bindings) {
            uploadUrlPublishService.publishUploadUrl(
                    binding.getSerial(),
                    binding.getPlantId(),
                    today,
                    slot
            );
        }

        log.info("[UploadUrlScheduler] Dispatched {} async publish tasks for slot={}", bindings.size(), slot);
    }
}
