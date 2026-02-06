package com.ssukssuk.controller.admin;

import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.domain.device.Device;
import com.ssukssuk.domain.plant.Species;
import com.ssukssuk.dto.admin.DeviceCreateRequest;
import com.ssukssuk.dto.admin.SpeciesCreateRequest;
import com.ssukssuk.repository.device.DeviceRepository;
import com.ssukssuk.repository.plant.SpeciesRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
public class AdminController {

    private final DeviceRepository deviceRepository;
    private final SpeciesRepository speciesRepository;

    @PostMapping("/devices")
    public ApiResponse<Long> createDevice(@Valid @RequestBody DeviceCreateRequest request) {
        Device device = Device.builder()
                .serial(request.serial())
                .build();
        Device saved = deviceRepository.save(device);
        return ApiResponse.ok(saved.getDeviceId());
    }

    @PostMapping("/species")
    public ApiResponse<Long> createSpecies(@Valid @RequestBody SpeciesCreateRequest request) {
        Species species = Species.builder()
                .name(request.name())
                .tempMin(request.tempMin())
                .tempMax(request.tempMax())
                .humMin(request.humMin())
                .humMax(request.humMax())
                .waterMin(request.waterMin())
                .waterMax(request.waterMax())
                .ecMin(request.ecMin())
                .ecMax(request.ecMax())
                .ledStart(request.ledStart())
                .ledEnd(request.ledEnd())
                .build();
        Species saved = speciesRepository.save(species);
        return ApiResponse.ok(saved.getSpeciesId());
    }
}
