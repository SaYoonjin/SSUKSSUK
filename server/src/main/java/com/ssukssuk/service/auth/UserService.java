package com.ssukssuk.service.auth;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.common.security.JwtTokenProvider;
import com.ssukssuk.domain.auth.RefreshToken;
import com.ssukssuk.domain.auth.User;
import com.ssukssuk.domain.auth.UserMode;
import com.ssukssuk.dto.auth.*;
import com.ssukssuk.repository.auth.RefreshTokenRepository;
import com.ssukssuk.repository.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
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
                .nickname(req.nickname().trim())
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

    @Transactional
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

        refreshTokenRepository.save(
                RefreshToken.builder()
                        .userId(user.getId())
                        .token(refreshToken)
                        .expiresAt(jwtTokenProvider.getRefreshTokenExpiry())
                        .build()
        );

        return new LoginResponse(
                user.getId(),
                user.getEmail(),
                user.isAdmin(),
                accessToken,
                refreshToken
        );
    }

    @Transactional
    public TokenRefreshResponse refresh(TokenRefreshRequest req) {
        String refreshToken = req.refreshToken();

        if (!jwtTokenProvider.validate(refreshToken)
                || !"REFRESH".equals(jwtTokenProvider.getTokenType(refreshToken))) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        RefreshToken savedToken = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new CustomException(ErrorCode.UNAUTHORIZED));

        if (savedToken.isRevoked()) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        savedToken.revoke();

        Long userId = jwtTokenProvider.getUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (user.getRemovedAt() != null) {
            throw new CustomException(ErrorCode.USER_DELETED);
        }

        String newAccessToken = jwtTokenProvider.createAccessToken(
                user.getId(),
                user.getEmail(),
                user.isAdmin()
        );

        String newRefreshToken = jwtTokenProvider.createRefreshToken(user.getId());

        refreshTokenRepository.save(
                RefreshToken.builder()
                        .userId(user.getId())
                        .token(newRefreshToken)
                        .expiresAt(jwtTokenProvider.getRefreshTokenExpiry())
                        .build()
        );

        return new TokenRefreshResponse(
                newAccessToken,
                newRefreshToken,
                jwtTokenProvider.getAccessTokenExpiresInSeconds()
        );
    }

    @Transactional(readOnly = true)
    public MeResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (user.getRemovedAt() != null) {
            throw new CustomException(ErrorCode.USER_DELETED);
        }

        return new MeResponse(user.getId(), user.getNickname());
    }

    @Transactional
    public void updateNickname(Long userId, NicknameUpdateRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (user.getRemovedAt() != null) {
            throw new CustomException(ErrorCode.USER_DELETED);
        }

        String newNickname = req.newNickname().trim();

        if (newNickname.equals(user.getNickname())) return;

        if (userRepository.existsByNickname(newNickname)) {
            throw new CustomException(ErrorCode.NICKNAME_DUPLICATE);
        }

        user.changeNickname(newNickname);
    }

    @Transactional
    public void updatePassword(Long userId, PasswordUpdateRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (user.getRemovedAt() != null) {
            throw new CustomException(ErrorCode.USER_DELETED);
        }

        if (!req.newPassword().equals(req.confirmPassword())) {
            throw new CustomException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }

        if (!passwordEncoder.matches(req.currentPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.INVALID_PASSWORD);
        }

        user.changePassword(passwordEncoder.encode(req.newPassword()));
    }
}