package com.ssukssuk.service.upload;

import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class UploadUrlService {

    public String createImageUploadUrl(String serial, Long plantId) {
        // TODO: S3 presigned URL로 교체
        return "https://upload.example.com/"
                + serial + "/"
                + plantId + "/"
                + UUID.randomUUID();
    }

    public OffsetDateTime expiredAt() {
        return OffsetDateTime.now().plusMinutes(10);
    }
}
