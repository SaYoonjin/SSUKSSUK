package com.ssukssuk.infra.mqtt.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public class ActionResultMessage {

    @JsonProperty("msg_id")
    private String msgId;

    @JsonProperty("sent_at")
    private String sentAt;

    @JsonProperty("serial_num")
    private String serialNum;

    @JsonProperty("plant_id")
    private Long plantId;

    private String type;

    @JsonProperty("action_type")
    private String actionType;

    @JsonProperty("result_status")
    private String resultStatus;

    @JsonProperty("before_value")
    private Float beforeValue;

    @JsonProperty("after_value")
    private Float afterValue;

    @JsonProperty("error_code")
    private String errorCode;

    @JsonProperty("error_message")
    private String errorMessage;
}