package com.ssukssuk.service.auth;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.domain.auth.User;
import com.ssukssuk.domain.auth.UserMode;
import com.ssukssuk.dto.auth.LoginResponse;
import com.ssukssuk.dto.auth.UserResponse;
import com.ssukssuk.dto.auth.LoginRequest;
import com.ssukssuk.dto.auth.SignUpRequest;
import com.ssukssuk.common.security.JwtTokenProvider;
import com.ssukssuk.repository.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public UserResponse signUp(SignUpRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new CustomException(ErrorCode.EMAIL_DUPLICATE);
        }

        User user = User.builder()
                .email(req.email())
                .password(passwordEncoder.encode(req.password()))
                .nickname(req.nickname())
                .mode(UserMode.AUTO)
                .isAdmin(false)
                .build();

        User saved = userRepository.save(user);

        return new UserResponse(
                saved.getId(),
                saved.getEmail(),
                saved.getNickname(),
                saved.isAdmin()
        );
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new CustomException(ErrorCode.LOGIN_FAILED));

        if (user.getRemovedAt() != null) {
            throw new CustomException(ErrorCode.USER_DELETED);
        }

        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new CustomException(ErrorCode.LOGIN_FAILED);
        }

        String accessToken = jwtTokenProvider.createAccessToken(
                user.getId(),
                user.getEmail(),
                user.isAdmin()
        );

        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());

        return new LoginResponse(
                user.getId(),
                user.getEmail(),
                user.isAdmin(),
                accessToken,
                refreshToken
        );
    }
}