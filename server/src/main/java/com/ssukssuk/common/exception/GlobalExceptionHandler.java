package com.ssukssuk.common.exception;

import com.ssukssuk.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiResponse<Void>> handleCustom(CustomException e) {
        ErrorCode ec = e.getErrorCode();
        return ResponseEntity
                .status(ec.getHttpStatus())
                .body(ApiResponse.fail(ec.getCode(), e.getMessage()));
    }

    // @Valid 검증 실패
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
        String detail = e.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::formatFieldError)
                .collect(Collectors.joining(", "));

        ErrorCode ec = ErrorCode.VALIDATION_ERROR;
        String msg = detail.isBlank() ? ec.getMessage() : detail;

        return ResponseEntity
                .status(ec.getHttpStatus())
                .body(ApiResponse.fail(ec.getCode(), msg));
    }

    // JSON 파싱 실패 / 타입 mismatch 등
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotReadable(HttpMessageNotReadableException e) {
        ErrorCode ec = ErrorCode.VALIDATION_ERROR;
        return ResponseEntity
                .status(ec.getHttpStatus())
                .body(ApiResponse.fail(ec.getCode(), "요청 본문(JSON) 파싱 실패"));
    }

    // 최후의 보루
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        ErrorCode ec = ErrorCode.INTERNAL_SERVER_ERROR;
        return ResponseEntity
                .status(ec.getHttpStatus())
                .body(ApiResponse.fail(ec.getCode(), ec.getMessage()));
    }

    private String formatFieldError(FieldError fe) {
        String field = fe.getField();
        String message = fe.getDefaultMessage();
        return field + ": " + message;
    }
}