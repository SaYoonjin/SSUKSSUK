package com.ssukssuk.service.s3;

import com.ssukssuk.repository.plant.BindingProjection;
import com.ssukssuk.repository.plant.UserPlantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class UploadUrlScheduler {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HHmm");

    private final UserPlantRepository userPlantRepository;
    private final UploadUrlPublishService uploadUrlPublishService;

    // === 운영용 스케줄러 (6시, 18시) ===
     @Scheduled(cron = "0 0 6 * * *", zone = "Asia/Seoul")
     public void scheduleMorning() {
         String slot = LocalTime.now(KST).format(TIME_FORMAT);
         log.info("[UploadUrlScheduler] Morning batch started (slot={})", slot);
         publishToAllConnectedPlants(slot);
     }

     @Scheduled(cron = "0 0 18 * * *", zone = "Asia/Seoul")
     public void scheduleEvening() {
         String slot = LocalTime.now(KST).format(TIME_FORMAT);
         log.info("[UploadUrlScheduler] Evening batch started (slot={})", slot);
         publishToAllConnectedPlants(slot);
     }

    // === 테스트용 스케줄러 (5분마다) ===
//    @Scheduled(cron = "0 */5 * * * *", zone = "Asia/Seoul")
//    public void scheduleTest() {
//        log.info("[UploadUrlScheduler] Test batch started (every 5 minutes)");
//        publishToAllConnectedPlants("TEST");
//    }

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
