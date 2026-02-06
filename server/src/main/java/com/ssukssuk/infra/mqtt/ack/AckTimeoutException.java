package com.ssukssuk.infra.mqtt.ack;

public class AckTimeoutException extends RuntimeException {
    public AckTimeoutException(String serial, String refMsgId) {
        super("ACK_TIMEOUT: serial=" + serial + ", ref_msg_id=" + refMsgId);
    }
}