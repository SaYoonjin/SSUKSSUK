package com.ssukssuk.service.s3;

import com.ssukssuk.dto.s3.UploadUrlItem;
import com.ssukssuk.dto.s3.UploadUrlPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class S3PresignService {

    private static final String CONTENT_TYPE = "image/jpeg";
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter ISO_OFFSET = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
    private static final String S3_URL_FORMAT = "https://%s.s3.%s.amazonaws.com/%s";

    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.region:ap-northeast-2}")
    private String region;

    @Value("${aws.s3.presign-expiration-sec:900}")
    private int defaultExpirationSec;

    /**
     * S3 object key를 public URL로 변환
     *
     * @param objectKey S3 object key (예: plants/42/images/2026/01/27/0600/top.jpg)
     * @return public URL (예: https://bucket.s3.ap-northeast-2.amazonaws.com/plants/42/...)
     */
    public String toPublicUrl(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return null;
        }
        return String.format(S3_URL_FORMAT, bucket, region, objectKey);
    }

    public UploadUrlPayload generateUploadUrlPayload(
            String serialNum,
            Long plantId,
            LocalDate date,
            String slot,
            Integer expiresInSec
    ) {
        int expiration = (expiresInSec != null) ? expiresInSec : defaultExpirationSec;

        String topKey = buildObjectKey(plantId, date, slot, "top");
        String sideKey = buildObjectKey(plantId, date, slot, "side");

        UploadUrlItem topItem = buildItem("TOP", topKey, expiration);
        UploadUrlItem sideItem = buildItem("SIDE", sideKey, expiration);

        OffsetDateTime now = OffsetDateTime.now(KST);

        return UploadUrlPayload.builder()
                .msgId(UUID.randomUUID().toString())
                .sentAt(now.format(ISO_OFFSET))
                .serialNum(serialNum)
                .plantId(plantId)
                .type("UPLOAD_URL")
                .expiresInSec(expiration)
                .items(List.of(topItem, sideItem))
                .build();
    }

    private String buildObjectKey(Long plantId, LocalDate date, String slot, String view) {
        return String.format("plants/%d/images/%04d/%02d/%02d/%s/%s.jpg",
                plantId,
                date.getYear(),
                date.getMonthValue(),
                date.getDayOfMonth(),
                slot,
                view
        );
    }

    private UploadUrlItem buildItem(String viewType, String objectKey, int expirationSec) {
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .contentType(CONTENT_TYPE)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(expirationSec))
                .putObjectRequest(putRequest)
                .build();

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);
        String uploadUrl = presignedRequest.url().toString();

        return UploadUrlItem.builder()
                .viewType(viewType)
                .objectKey(objectKey)
                .uploadUrl(uploadUrl)
                .headers(Map.of("Content-Type", CONTENT_TYPE))
                .build();
    }
}