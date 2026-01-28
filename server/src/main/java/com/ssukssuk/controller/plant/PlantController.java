package com.ssukssuk.controller.plant;

import com.ssukssuk.dto.plant.CreatePlantRequest;
import com.ssukssuk.dto.plant.CreatePlantResponse;
import com.ssukssuk.service.plant.UserPlantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/plants")
public class PlantController {

    private final UserPlantService userPlantService;

    @PostMapping
    public CreatePlantResponse createPlant(
            @AuthenticationPrincipal Long userId,
            @RequestBody @Valid CreatePlantRequest request
    ) {
        return userPlantService.createPlant(
                userId,
                request.getSpecies(),
                request.getDeviceId(),
                request.getName(),
                request.getIsMain()
        );
    }
}
