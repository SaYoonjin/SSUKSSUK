package com.ssukssuk.controller.plant;

import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.dto.plant.*;
import com.ssukssuk.service.plant.NutrientSensorService;
import com.ssukssuk.service.plant.SpeciesService;
import com.ssukssuk.service.plant.UserPlantService;
import com.ssukssuk.service.plant.WaterSensorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/plants")
public class PlantController {

    private final UserPlantService userPlantService;
    private final SpeciesService speciesService;
    private final WaterSensorService waterSensorService;
    private final NutrientSensorService nutrientSensorService;

    @GetMapping("/species")
    public ApiResponse<List<SpeciesResponse>> getAllSpecies(

    ) {
        return ApiResponse.ok(speciesService.getAllSpecies());
    }

    @PostMapping
    public ApiResponse<CreatePlantResponse> createPlant(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody CreatePlantRequest request
    ) {
        CreatePlantResponse response = userPlantService.createPlant(
                userId,
                request.getSpecies(),
                request.getDeviceId(),
                request.getName()
        );

        if (response.hasBindingError()) {
            return ApiResponse.okWithError(
                    response,
                    "DEVICE_BINDING_FAILED",
                    response.getBindingError()
            );
        }

        return ApiResponse.ok(response);
    }

    @PatchMapping("/{plantId}")
    public ApiResponse<Void> updatePlant(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long plantId,
            @RequestBody UpdatePlantRequest request
    ) {
        userPlantService.updatePlant(userId, plantId, request);
        return ApiResponse.ok();
    }

    @GetMapping
    public ApiResponse<List<MyPlantResponse>> getMyPlants(
            @AuthenticationPrincipal Long userId
    ) {
        return ApiResponse.ok(
                userPlantService.getMyPlants(userId)
        );
    }

    @GetMapping("/{plantId}/sensors/water")
    public ApiResponse<WaterCardResponse> getWaterCard(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long plantId
    ) {
        return ApiResponse.ok(
                waterSensorService.getWaterCard(userId, plantId)
        );
    }

    @GetMapping("/{plantId}/sensors/nutrient")
    public ApiResponse<NutrientCardResponse> getNutrientCard(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long plantId
    ) {
        return ApiResponse.ok(
                nutrientSensorService.getNutrientCard(userId, plantId)
        );
    }

    @DeleteMapping("/{plantId}")
    public ApiResponse<Void> deletePlant(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long plantId
    ) {
        userPlantService.deletePlant(userId, plantId);
        return ApiResponse.ok();
    }

    @PatchMapping("/{plantId}/main")
    public ApiResponse<Void> switchMainPlant(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long plantId
    ) {
        userPlantService.switchMainPlant(userId, plantId);
        return ApiResponse.ok();
    }

    @PostMapping("/{plantId}/unbind")
    public ApiResponse<Void> unbindPlantDevice(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long plantId
    ) {
        userPlantService.unbindPlantDevice(userId, plantId);
        return ApiResponse.ok();
    }

}
