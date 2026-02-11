package com.ssukssuk.dto.s3;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UploadUrlTestRequest {

    @NotBlank
    @JsonProperty("serial_num")
    private String serialNum;

    @NotNull
    @JsonProperty("plant_id")
    private Long plantId;

    @JsonProperty("date")
    private String date;

    @Pattern(regexp = "\\d{4}", message = "slot must be 4-digit time format (e.g., '1840')")
    private String slot;

    @JsonProperty("expires_in_sec")
    private Integer expiresInSec;

    @JsonProperty("publish")
    private Boolean publish;
}
