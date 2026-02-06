package com.ssukssuk.common.response;

import lombok.Builder;

@Builder
public record ApiResponse<T>(
        boolean success,
        T data,
        ApiError error
) {
    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .error(null)
                .build();
    }

    public static ApiResponse<Void> ok() {
        return ok(null);
    }

    public static ApiResponse<Void> fail(String code, String message) {
        return ApiResponse.<Void>builder()
                .success(false)
                .data(null)
                .error(new ApiError(code, message))
                .build();
    }

    public static <T> ApiResponse<T> okWithError(T data, String code, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .error(new ApiError(code, message))
                .build();
    }

    public record ApiError(String code, String message) {}
}