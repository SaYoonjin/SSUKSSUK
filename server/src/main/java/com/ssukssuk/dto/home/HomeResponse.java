package com.ssukssuk.dto.home;

import com.ssukssuk.domain.plant.PlantStatus;
import com.ssukssuk.domain.plant.UserPlant;

public record HomeResponse(
        Long plantId,
        String plantName,
        Integer characterCode,
        Integer healthScore,
        String waterLevelStatus,
        String nutrientStatus,
        Float temperature,
        Float humidity,
        String temperatureStatus,
        String humidityStatus,
        Boolean hasUnreadNotification
) {
    public static HomeResponse from(UserPlant userPlant, PlantStatus status) {
        return new HomeResponse(
                userPlant.getPlantId(),
                userPlant.getPlantName(),
                status.getCharacterCode(),
                status.getHealthScore(),
                status.getWaterLevelStatus() != null ? status.getWaterLevelStatus().name() : null,
                status.getNutrientConcStatus() != null ? status.getNutrientConcStatus().name() : null,
                status.getTemperature(),
                status.getHumidity(),
                status.getTemperatureStatus() != null ? status.getTemperatureStatus().name() : null,
                status.getHumidityStatus() != null ? status.getHumidityStatus().name() : null,
                status.getHasUnreadNotification()
        );
    }
}
