package com.ssukssuk.common.mqtt.dto;

import lombok.Getter;

@Getter
public class SensorUplinkMessage {
    private String msg_id;
    private String sent_at;
    private String serial_num;
    private Long plant_id;
    private String type;

    private Double temperature;
    private Double humidity;
    private Double ec;
    private Double water_level;
}