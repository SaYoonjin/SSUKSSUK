package com.ssukssuk.service.scheduler;

import com.ssukssuk.repository.plant.UserPlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImageCaptureScheduler {

    private final UserPlantRepository userPlantRepository;

    @Scheduled(cron = "0 0 9,18 * * *")
    public void requestImageCapture() {

        userPlantRepository.findAllActiveBindings()
                .forEach(binding -> {

                    String uploadUrl = generateUploadUrl(binding.getPlantId());
                    String msgId = UUID.randomUUID().toString();

                });
    }

    private String generateUploadUrl(Long plantId) {
        // TODO: S3 presigned url / mock
        return "https://example.com/upload/" + plantId;
    }
}
