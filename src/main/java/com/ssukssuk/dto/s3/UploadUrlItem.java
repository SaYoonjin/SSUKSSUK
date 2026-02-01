package com.ssukssuk.dto.s3;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class UploadUrlItem {

    @JsonProperty("view_type")
    private String viewType;

    @JsonProperty("object_key")
    private String objectKey;

    @JsonProperty("upload_url")
    private String uploadUrl;

    @JsonProperty("headers")
    private Map<String, String> headers;
}