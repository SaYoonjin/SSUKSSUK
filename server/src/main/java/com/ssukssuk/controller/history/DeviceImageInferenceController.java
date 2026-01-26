package com.ssukssuk.controller.history;

import com.ssukssuk.dto.history.DeviceImageInferenceRequest;
import com.ssukssuk.service.history.ImageInferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/history/device")
@RequiredArgsConstructor
public class DeviceImageInferenceController {

    private final ImageInferenceService imageInferenceService;

    @PostMapping("/image-inference")
    public ResponseEntity<Void> receive(
            @RequestBody DeviceImageInferenceRequest request
    ) {
        imageInferenceService.handle(request);
        return ResponseEntity.ok().build();
    }
}
