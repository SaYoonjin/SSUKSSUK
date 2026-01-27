package com.ssukssuk.dto.history;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class DeviceImageUploadedRequest {

    @JsonProperty("msg_id")
    private String msgId;

    @JsonProperty("sent_at")
    private String sentAt;

    @JsonProperty("serial_num")
    private String serialNum;

    @JsonProperty("plant_id")
    private Long plantId;

    private String type; // IMAGE_UPLOADED

    @JsonProperty("image_kind")
    private String imageKind;

    @JsonProperty("upload_url")
    private String uploadUrl;

    @JsonProperty("uploaded_at")
    private LocalDateTime uploadedAt;
}
