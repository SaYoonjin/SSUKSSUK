package com.ssukssuk.service.s3;

import com.ssukssuk.dto.s3.UploadUrlPayload;
import com.ssukssuk.infra.mqtt.MqttPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class UploadUrlPublishService {

    private static final String TOPIC_CHANNEL = "upload-url";

    private final S3PresignService s3PresignService;
    private final MqttPublisher mqttPublisher;

    @Async("uploadUrlExecutor")
    public void publishUploadUrl(String serialNum, Long plantId, LocalDate date, String slot) {
        try {
            UploadUrlPayload payload = s3PresignService.generateUploadUrlPayload(
                    serialNum, plantId, date, slot, null
            );

            String topic = MqttPublisher.controlTopic(serialNum, TOPIC_CHANNEL);

            log.info("[UploadUrl] Generating presigned URLs: serial={}, plantId={}, date={}, slot={}",
                    serialNum, plantId, date, slot);

            for (var item : payload.getItems()) {
                log.info("[UploadUrl] Item: viewType={}, objectKey={}", item.getViewType(), item.getObjectKey());
                log.debug("[UploadUrl] URL: {}", item.getUploadUrl());
            }

            mqttPublisher.publish(topic, payload);

            log.info("[UploadUrl] Published to topic={}, serial={}, plantId={}, slot={}, expiresIn={}s",
                    topic, serialNum, plantId, slot, payload.getExpiresInSec());
        } catch (Exception e) {
            log.error("[UploadUrl] Failed to publish: serial={}, plantId={}, slot={}", serialNum, plantId, slot, e);
        }
    }

    public UploadUrlPayload publishAndReturn(
            String serialNum,
            Long plantId,
            LocalDate date,
            String slot,
            Integer expiresInSec,
            boolean publish
    ) {
        UploadUrlPayload payload = s3PresignService.generateUploadUrlPayload(
                serialNum, plantId, date, slot, expiresInSec
        );

        if (publish) {
            String topic = MqttPublisher.controlTopic(serialNum, TOPIC_CHANNEL);
            mqttPublisher.publish(topic, payload);
            log.info("[UploadUrl] Published (test) to serial={}, plantId={}, slot={}", serialNum, plantId, slot);
        }

        return payload;
    }
}