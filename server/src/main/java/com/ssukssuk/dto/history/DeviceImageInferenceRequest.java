package com.ssukssuk.dto.history;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

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

    @JsonProperty("type")
    private String type; // IMAGE_INFERENCE

    @JsonProperty("symptom_enum")
    private String symptomEnum;

    // inference 결과
    @JsonProperty("height")
    private Double height;
    @JsonProperty("width")
    private Double width;
    @JsonProperty("anomaly")
    private Integer anomaly;
    @JsonProperty("confidence")
    private Integer confidence;

    @JsonProperty("diagnosis_message")
    private String diagnosisMessage;

    // TOP 이미지
    @JsonProperty("image_kind1")
    private String imageKind1;   // TOP

    @JsonProperty("public_url1")
    private String publicUrl1;

    @JsonProperty("measured_at1")
    private OffsetDateTime measuredAt1;

    // SIDE 이미지
    @JsonProperty("image_kind2")
    private String imageKind2;   // SIDE

    @JsonProperty("public_url2")
    private String publicUrl2;

    @JsonProperty("measured_at2")
    private OffsetDateTime measuredAt2;
}

