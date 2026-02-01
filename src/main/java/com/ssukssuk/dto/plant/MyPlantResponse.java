package com.ssukssuk.dto.plant;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.ssukssuk.domain.device.Device;
import com.ssukssuk.domain.plant.Species;
import com.ssukssuk.domain.plant.UserPlant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MyPlantResponse {

    private Long plant_id;

    private Long species_id;

    private String name;

    @JsonProperty("is_main")
    private boolean main;

    // 직렬화할 때 is_connected 로 처리됨
    @JsonProperty("is_connected")
    private boolean connected;

    private Long device_id;

    public static MyPlantResponse from(
            UserPlant userPlant,
            Species species,
            Device device
    ) {
        // 디바이스 존재하고, pairing 상태 true 일 때만 연결된 것으로 판단
        boolean isConnected =
                device != null && Boolean.TRUE.equals(device.getPairing());

        return MyPlantResponse.builder()
                .plant_id(userPlant.getPlantId())
                .species_id(species.getSpeciesId())
                .name(species.getName())
                .main(userPlant.getIsMain())
                .connected(isConnected)
                .device_id(device != null ? device.getDeviceId() : null)
                .build();
    }
}
