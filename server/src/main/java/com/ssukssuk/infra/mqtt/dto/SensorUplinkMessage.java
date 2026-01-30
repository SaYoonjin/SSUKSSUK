package com.ssukssuk.infra.mqtt.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

@Getter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
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

    @JsonProperty("event_kind")
    private EventKind eventKind;

    @JsonProperty("trigger_sensor_type")
    private TriggerSensorType triggerSensorType;

    private Values values;

    private Map<String, SensorStatus> status;

    public Float getTemperature() { return values != null ? values.temperature : null; }
    public Float getHumidity() { return values != null ? values.humidity : null; }
    public Float getWaterLevel() { return values != null ? values.waterLevel : null; }
    public Float getNutrientConc() { return values != null ? values.nutrientConc : null; }

    public SensorStatus getTemperatureStatus() { return status != null ? status.get("temperature") : null; }
    public SensorStatus getHumidityStatus() { return status != null ? status.get("humidity") : null; }
    public SensorStatus getWaterLevelStatus() { return status != null ? status.get("water_level") : null; }
    public SensorStatus getNutrientConcStatus() { return status != null ? status.get("nutrient_conc") : null; }

    @Getter
    @NoArgsConstructor
    public static class Values {
        private Float temperature;
        private Float humidity;

        @JsonProperty("water_level")
        private Float waterLevel;

        @JsonProperty("nutrient_conc")
        private Float nutrientConc;
    }

    public enum EventKind { PERIODIC, ANOMALY_DETECTED, RECOVERY_DONE }
    public enum TriggerSensorType {
        WATER_LEVEL(1),
        NUTRIENT_CONC(2);

        private final int code;

        TriggerSensorType(int code) { this.code = code; }
        public int getCode() { return code; }
    }
    public enum SensorStatus { OK, UP, DOWN }
}