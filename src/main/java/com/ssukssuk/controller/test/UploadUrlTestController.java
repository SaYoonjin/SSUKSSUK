package com.ssukssuk.controller.test;

import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.dto.s3.UploadUrlPayload;
import com.ssukssuk.dto.s3.UploadUrlTestRequest;
import com.ssukssuk.service.s3.UploadUrlPublishService;
import com.ssukssuk.service.s3.UploadUrlScheduler;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/test/upload-url")
@RequiredArgsConstructor
public class UploadUrlTestController {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final UploadUrlPublishService uploadUrlPublishService;
    private final UploadUrlScheduler uploadUrlScheduler;

    @PostMapping
    public ResponseEntity<ApiResponse<UploadUrlPayload>> generateUploadUrl(
            @Valid @RequestBody UploadUrlTestRequest request
    ) {
        LocalDate date = (request.getDate() != null)
                ? LocalDate.parse(request.getDate(), DATE_FORMAT)
                : LocalDate.now(KST);

        boolean publish = (request.getPublish() != null) ? request.getPublish() : true;

        UploadUrlPayload payload = uploadUrlPublishService.publishAndReturn(
                request.getSerialNum(),
                request.getPlantId(),
                date,
                request.getSlot(),
                request.getExpiresInSec(),
                publish
        );

        return ResponseEntity.ok(ApiResponse.ok(payload));
    }

    @PostMapping("/batch")
    public ResponseEntity<?> triggerBatch(@RequestParam String slot) {
        if (!slot.equals("0600") && !slot.equals("1800")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("INVALID_SLOT", "slot must be '0600' or '1800'"));
        }

        uploadUrlScheduler.publishToAllConnectedPlants(slot);

        return ResponseEntity.ok(ApiResponse.ok("Batch triggered for slot=" + slot));
    }
}
