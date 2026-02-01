package com.ssukssuk.infra.mqtt;

public final class Topic {

    private Topic() {}

    // 업링크 (device -> server) subscribe wildcard
    public static final String TELEMETRY_SENSORS =
            "devices/+/telemetry/sensors";
    public static final String TELEMETRY_ACTION_RESULT =
            "devices/+/telemetry/action-result";
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

    /** devices/{serial}/control/ack */
    public static String ackTopic(String serial) {
        return String.format(CONTROL_ACK, serial);
    }

    /** topic: devices/{serial}/telemetry/{channel} */
    public static String extractSerial(String topic) {
        if (topic == null) return null;
        String[] p = topic.split("/");
        return (p.length >= 2) ? p[1] : null;
    }

    /** topic: devices/{serial}/telemetry/{channel} -> channel */
    public static String extractTelemetryChannel(String topic) {
        if (topic == null) return null;
        String[] p = topic.split("/");
        // devices / {serial} / telemetry / {channel}
        return (p.length >= 4) ? p[3] : null;
    }

    public static boolean isTelemetry(String topic) {
        return topic != null && topic.contains("/telemetry/");
    }

    public static boolean isControlAck(String topic) {
        return topic != null && topic.endsWith("/control/ack");
    }
}
