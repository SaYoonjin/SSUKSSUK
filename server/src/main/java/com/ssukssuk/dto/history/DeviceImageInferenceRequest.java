package com.ssukssuk.dto.history;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class DeviceImageInferenceRequest {

    @JsonProperty("msg_id")
    private String msgId;

    @JsonProperty("sent_at")
    private String sentAt;

    @JsonProperty("serial_num")
    private String serialNum;

    @JsonProperty("plant_id")
    private Long plantId;

    private String type;

    private Double height;
    private Double width;
    private Double anomaly;
    private Double confidence;

    @JsonProperty("image_kind1")
    private String imageKind1;

    @JsonProperty("public_url1")
    private String publicUrl1;

    @JsonProperty("measured_at1")
    private LocalDateTime measuredAt1;

    @JsonProperty("image_kind2")
    private String imageKind2;

    @JsonProperty("public_url2")
    private String publicUrl2;

    @JsonProperty("measured_at2")
    private LocalDateTime measuredAt2;
}
