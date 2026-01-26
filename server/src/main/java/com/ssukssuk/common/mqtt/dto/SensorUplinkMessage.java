package com.ssukssuk.common.mqtt.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SensorUplinkMessage {

    @JsonProperty("msg_id")
    private String msgId;

    @JsonProperty("sent_at")
    private String sentAt;

    @JsonProperty("serial_num")
    private String serialNum;

    @JsonProperty("plant_id")
    private Long plantId;

    private String type;

    private Float temperature;
    private Float humidity;

    @JsonProperty("water_level")
    private Float waterLevel;

    @JsonProperty("nutrient_conc")
    private Float nutrientConc;
}
