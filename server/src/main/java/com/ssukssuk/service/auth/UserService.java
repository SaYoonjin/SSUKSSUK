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

    /* ===================== 회원가입 ===================== */

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

    /* ===================== 로그인 ===================== */

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

        // 🔹 refresh token DB 저장
        RefreshToken token = RefreshToken.builder()
                .userId(user.getId())
                .token(refreshToken)
                .expiresAt(jwtTokenProvider.getRefreshTokenExpiry())
                .build();

        refreshTokenRepository.save(token);

        return new LoginResponse(
                user.getId(),
                user.getEmail(),
                user.isAdmin(),
                accessToken,
                refreshToken
        );
    }

    /* ===================== 토큰 재발급 ===================== */

    @Transactional
    public TokenRefreshResponse refresh(TokenRefreshRequest req) {

        String refreshToken = req.refreshToken();

        // 1. JWT 검증
        if (!jwtTokenProvider.validate(refreshToken)
                || !"REFRESH".equals(jwtTokenProvider.getTokenType(refreshToken))) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        // 2. DB 확인
        RefreshToken savedToken = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new CustomException(ErrorCode.UNAUTHORIZED));

        if (savedToken.isRevoked()) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        // 3. 기존 refresh 폐기
        savedToken.revoke();

        // 4. 사용자 조회
        Long userId = jwtTokenProvider.getUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 5. 새 토큰 발급
        String newAccessToken = jwtTokenProvider.createAccessToken(
                user.getId(),
                user.getEmail(),
                user.isAdmin()
        );

        String newRefreshToken = jwtTokenProvider.createRefreshToken(user.getId());

        RefreshToken newToken = RefreshToken.builder()
                .userId(user.getId())
                .token(newRefreshToken)
                .expiresAt(jwtTokenProvider.getRefreshTokenExpiry())
                .build();

        refreshTokenRepository.save(newToken);

        return new TokenRefreshResponse(
                newAccessToken,
                newRefreshToken,
                jwtTokenProvider.getAccessTokenExpiresInSeconds()
        );
    }
}
