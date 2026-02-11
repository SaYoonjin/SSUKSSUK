package com.ssukssuk.infra.mqtt.dto;

import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AckMessage {

    private String msg_id;
    private String sent_at;

    private String serial_num;
    private Long plant_id;
    private String type;

    private String ref_msg_id;
    private String ref_type;
    private AckStatus status;

    private AckErrorCode error_code;
    private String error_message;

    public enum AckStatus {
        OK, DROPPED_DUPLICATE, DROPPED_OLD_SEQ, ERROR
    }

    public enum AckErrorCode {
        PLANT_NOT_BOUND,
        PLANT_DEVICE_MISMATCH,
        INVALID_PAYLOAD,
        SERVER_TEMP_UNAVAILABLE
    }

    public static AckMessage ok(String serialNum, Long plantId, String refMsgId, String refType, String newMsgId) {
        return AckMessage.builder()
                .msg_id(newMsgId)
                .sent_at(OffsetDateTime.now().toString())
                .serial_num(serialNum)
                .plant_id(plantId)
                .type("ACK")
                .ref_msg_id(refMsgId)
                .ref_type(refType)
                .status(AckStatus.OK)
                .error_code(null)
                .error_message(null)
                .build();
    }

    public static AckMessage error(String serialNum, Long plantId, String refMsgId, String refType,
                                   String newMsgId, AckErrorCode code, String msg) {
        return AckMessage.builder()
                .msg_id(newMsgId)
                .sent_at(OffsetDateTime.now().toString())
                .serial_num(serialNum)
                .plant_id(plantId)
                .type("ACK")
                .ref_msg_id(refMsgId)
                .ref_type(refType)
                .status(AckStatus.ERROR)
                .error_code(code)
                .error_message(msg)
                .build();
    }

    public static AckMessage droppedDuplicate(String serialNum, Long plantId, String refMsgId, String refType, String newMsgId) {
        return AckMessage.builder()
                .msg_id(newMsgId)
                .sent_at(OffsetDateTime.now().toString())
                .serial_num(serialNum)
                .plant_id(plantId)
                .type("ACK")
                .ref_msg_id(refMsgId)
                .ref_type(refType)
                .status(AckStatus.DROPPED_DUPLICATE)
                .error_code(null)
                .error_message(null)
                .build();
    }
}
