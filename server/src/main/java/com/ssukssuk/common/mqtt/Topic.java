package com.ssukssuk.common.mqtt;

public final class Topic {

    private Topic() {}

    // 업링크 (device -> server)
    public static final String TELEMETRY_SENSORS =
            "devices/+/telemetry/sensors";
    public static final String TELEMETRY_ACTION_RESULT =
            "devices/+/telemetry/action-result";
    public static final String TELEMETRY_UPLOAD_URL_REQUEST =
            "devices/+/telemetry/upload-url-request";
    public static final String TELEMETRY_IMAGE_UPLOADED =
            "devices/+/telemetry/image-uploaded";
    public static final String TELEMETRY_IMAGE_INFERENCE =
            "devices/+/telemetry/image-inference";

    // 다운링크 (server -> device)
    public static final String CONTROL_CLAIM =
            "devices/%s/control/claim";
    public static final String CONTROL_BINDING =
            "devices/%s/control/binding";
    public static final String CONTROL_MODE =
            "devices/%s/control/mode";
    public static final String CONTROL_UPLOAD_URL =
            "devices/%s/control/upload-url";

    // ACK
    public static final String CONTROL_ACK =
            "devices/%s/control/ack";

    // wildcard subscribe
    public static final String CONTROL_ACK_WILDCARD =
            "devices/+/control/ack";
}