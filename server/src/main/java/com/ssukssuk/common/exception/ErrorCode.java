package com.ssukssuk.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // 400
    VALIDATION_ERROR(
            HttpStatus.BAD_REQUEST,
            "VALIDATION_ERROR",
            "요청값 검증 실패"
    ),

    INVALID_PASSWORD(
            HttpStatus.BAD_REQUEST,
            "INVALID_PASSWORD",
            "기존 비밀번호가 올바르지 않습니다"
    ),

    PASSWORD_CONFIRM_MISMATCH(
            HttpStatus.BAD_REQUEST,
            "PASSWORD_CONFIRM_MISMATCH",
            "새 비밀번호 확인이 일치하지 않습니다"
    ),

    // 401
    UNAUTHORIZED(
            HttpStatus.UNAUTHORIZED,
            "UNAUTHORIZED",
            "인증 실패"
    ),
    LOGIN_FAILED(
            HttpStatus.UNAUTHORIZED,
            "LOGIN_FAILED",
            "이메일 또는 비밀번호가 올바르지 않습니다"
    ),

    // 403
    USER_DELETED(
            HttpStatus.FORBIDDEN,
            "USER_DELETED",
            "탈퇴한 사용자입니다"
    ),
    FORBIDDEN(
            HttpStatus.FORBIDDEN,
            "FORBIDDEN",
            "접근 권한이 없습니다"
    ),
    PLANT_ACCESS_DENIED(
            HttpStatus.FORBIDDEN,
            "PLANT_ACCESS_DENIED",
            "해당 식물에 대한 접근 권한이 없습니다"
    ),

    // 404
    NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "NOT_FOUND",
            "데이터가 존재하지 않습니다"
    ),
    USER_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "USER_NOT_FOUND",
            "사용자를 찾을 수 없습니다"
    ),

    SPECIES_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "SPECIES_NOT_FOUND",
            "존재하지 않는 식물 종입니다"
    ),

    DEVICE_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "DEVICE_NOT_FOUND",
            "존재하지 않는 디바이스입니다"
    ),

    PLANT_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "PLANT_NOT_FOUND",
            "존재하지 않는 식물입니다"
    ),

    DEVICE_ALREADY_CLAIMED(
            HttpStatus.CONFLICT,
            "CONFLICT",
            "이미 다른 사용자에게 연결된 디바이스입니다."
    ),

    DEVICE_ALREADY_PAIRED(
            HttpStatus.CONFLICT,
            "DEVICE_ALREADY_PAIRED",
            "이미 식물에 연결된 디바이스입니다."
    ),

    DEVICE_NOT_CLAIMED(
            HttpStatus.BAD_REQUEST,
            "DEVICE_NOT_CLAIMED",
            "아직 클레임되지 않은 디바이스입니다."
    ),

    DEVICE_NOT_OWNED(
            HttpStatus.FORBIDDEN,
            "DEVICE_NOT_OWNED",
            "본인 소유의 디바이스가 아닙니다."
    ),

    DEVICE_ACK_TIMEOUT(
            HttpStatus.GATEWAY_TIMEOUT,
            "DEVICE_ACK_TIMEOUT",
            "디바이스 응답 시간이 초과되었습니다."
    ),

    DEVICE_ACK_FAILED(
            HttpStatus.BAD_GATEWAY,
            "DEVICE_ACK_FAILED",
            "디바이스에서 오류가 발생했습니다."
    ),



    SENSOR_LOG_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "SENSOR_LOG_NOT_FOUND",
            "센서 데이터가 존재하지 않습니다."
    ),
    CHARACTER_CODE_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "CHARACTER_CODE_NOT_FOUND",
            "존재하지 않는 캐릭터 코드입니다"
    ),


    // 409
    EMAIL_DUPLICATE(
            HttpStatus.CONFLICT,
            "EMAIL_DUPLICATE",
            "이미 사용 중인 이메일입니다"
    ),

    NICKNAME_DUPLICATE(
            HttpStatus.CONFLICT,
            "NICKNAME_DUPLICATE",
            "이미 사용 중인 닉네임입니다"
    ),

    PLANT_ALREADY_MAIN(
            HttpStatus.CONFLICT,
            "PLANT_ALREADY_MAIN",
            "이미 대표 식물이 존재합니다"
    ),

    // 500
    INTERNAL_SERVER_ERROR(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "INTERNAL_SERVER_ERROR",
            "서버 내부 오류"
    );

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus httpStatus, String code, String message) {
        this.httpStatus = httpStatus;
        this.code = code;
        this.message = message;
    }
}
