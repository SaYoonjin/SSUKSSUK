package com.ssukssuk.common.mqtt.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UploadUrlCommand {

    private String msg_id;
    private String type;
    private Long plant_id;
    private String upload_url;
}
