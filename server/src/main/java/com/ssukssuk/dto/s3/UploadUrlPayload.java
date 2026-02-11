package com.ssukssuk.dto.s3;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class UploadUrlPayload {

    @JsonProperty("msg_id")
    private String msgId;

    @JsonProperty("sent_at")
    private String sentAt;

    @JsonProperty("serial_num")
    private String serialNum;

    @JsonProperty("plant_id")
    private Long plantId;

    @JsonProperty("type")
    private String type;

    @JsonProperty("expires_in_sec")
    private int expiresInSec;

    @JsonProperty("items")
    private List<UploadUrlItem> items;
}