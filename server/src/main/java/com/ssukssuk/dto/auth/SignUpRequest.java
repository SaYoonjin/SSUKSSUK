package com.ssukssuk.dto.auth;

import jakarta.validation.constraints.*;

public record SignUpRequest(
        @NotBlank @Email
        String email,

        // 8~20자 + 숫자/특수기호 최소 1개 포함
        @NotBlank
//        @Pattern(
//                regexp = "^(?=.*\\d)(?=.*[!@#$%^&*])[A-Za-z\\d!@#$%^&*]{8,20}$",
//                message = "비밀번호는 8~20자이며 숫자와 특수문자를 각각 최소 1개 포함해야 합니다"
//        )
        String password,

        @NotBlank
        @Size(max = 50, message = "닉네임은 최대 50자입니다")
        String nickname
) {}