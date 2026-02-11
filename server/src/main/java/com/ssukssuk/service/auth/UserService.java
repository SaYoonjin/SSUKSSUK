package com.ssukssuk.service.auth;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.common.security.JwtTokenProvider;
import com.ssukssuk.domain.auth.RefreshToken;
import com.ssukssuk.domain.auth.User;
import com.ssukssuk.domain.auth.UserMode;
import com.ssukssuk.domain.plant.UserPlant;
import com.ssukssuk.dto.auth.*;
import com.ssukssuk.repository.auth.RefreshTokenRepository;
import com.ssukssuk.repository.auth.UserRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import com.ssukssuk.repository.push.PushTokenRepository;
import com.ssukssuk.service.device.DeviceControlService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserPlantRepository userPlantRepository;
    private final PushTokenRepository pushTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final DeviceControlService deviceControlService;

    /* =========================
        회원가입
     ========================= */
    @Transactional
    public SignupResponse signUp(SignUpRequest req) {
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

        return new SignupResponse(
                saved.getId()
        );
    }

    /* =========================
        로그인
     ========================= */
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
                        .user(user)
                        .token(refreshToken)
                        .expiresAt(jwtTokenProvider.getRefreshTokenExpiry())
                        .build()
        );

        // mobileDeviceId가 있으면 fcm_token 테이블에서 user_id 매핑
        if (req.mobileDeviceId() != null && !req.mobileDeviceId().isBlank()) {
            pushTokenRepository.findByDeviceId(req.mobileDeviceId())
                    .ifPresent(pushToken -> pushToken.setUserId(user.getId()));
        }

        return new LoginResponse(
                user.getId(),
                user.getEmail(),
                user.isAdmin(),
                user.isInitialized(),
                accessToken,
                refreshToken
        );
    }

    /* =========================
        토큰 재발급
     ========================= */
    @Transactional
    public TokenRefreshResponse refresh(TokenRefreshRequest req) {
        String refreshToken = req.refreshToken();

        // JWT 검증
        if (!jwtTokenProvider.validate(refreshToken)
                || !"REFRESH".equals(jwtTokenProvider.getTokenType(refreshToken))) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        // DB 확인
        RefreshToken savedToken = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new CustomException(ErrorCode.UNAUTHORIZED));

        if (savedToken.isRevoked()) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        // 기존 토큰 폐기
        savedToken.revoke();

        Long userId = jwtTokenProvider.getUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (user.getRemovedAt() != null) {
            throw new CustomException(ErrorCode.USER_DELETED);
        }

        // 새 토큰 발급
        String newAccessToken = jwtTokenProvider.createAccessToken(
                user.getId(),
                user.getEmail(),
                user.isAdmin()
        );

        String newRefreshToken = jwtTokenProvider.createRefreshToken(user.getId());

        refreshTokenRepository.save(
                RefreshToken.builder()
                        .user(user)
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

    /* =========================
        내 정보 조회
     ========================= */
    @Transactional(readOnly = true)
    public MeResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (user.getRemovedAt() != null) {
            throw new CustomException(ErrorCode.USER_DELETED);
        }

        return new MeResponse(user.getId(), user.getNickname(),user.isInitialized());
    }

    /* =========================
        닉네임 변경
     ========================= */
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

    /* =========================
        비밀번호 변경
     ========================= */
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

    /* =========================
        로그아웃
     ========================= */
    @Transactional
    public void logout(Long userId, LogoutRequest req) {
        refreshTokenRepository.deleteByUser_Id(userId);

        // mobileDeviceId가 있으면 fcm_token 테이블에서 user_id 해제
        if (req != null && req.mobileDeviceId() != null && !req.mobileDeviceId().isBlank()) {
            pushTokenRepository.findByDeviceId(req.mobileDeviceId())
                    .ifPresent(pushToken -> pushToken.setUserId(null));
        }
    }

    /* =========================
        회원 탈퇴
     ========================= */
    @Transactional
    public void withdraw(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (user.getRemovedAt() != null) {
            throw new CustomException(ErrorCode.USER_DELETED);
        }

        user.withdraw();
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    /* =========================
        모드 변경 (AUTO / MANUAL)
     ========================= */
    @Transactional
    public ModeResponse updateMode(Long userId, ModeChangeRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (user.getRemovedAt() != null) {
            throw new CustomException(ErrorCode.USER_DELETED);
        }

        UserMode newMode = req.mode();

        // 같은 모드면 현재 상태 반환
        if (user.getMode() == newMode) {
            return new ModeResponse(user.getMode(), user.getUpdatedAt().toString());
        }

        // 활성 식물-디바이스 연결 조회
        List<UserPlant> activeConnections = userPlantRepository.findActiveConnectionsByUserId(userId);

        // 1. 모든 디바이스에 MQTT 발송 + ACK 대기 (하나라도 실패하면 예외 발생)
        for (UserPlant plant : activeConnections) {
            deviceControlService.sendModeUpdate(
                    plant.getDevice().getSerial(),
                    plant.getPlantId(),
                    newMode.name()
            );
        }

        // 2. 모든 ACK 성공 시 DB 업데이트
        user.changeMode(newMode);

        return new ModeResponse(user.getMode(), user.getUpdatedAt().toString());
    }

    // 초기 온보딩(스킵/디바이스 등록) 완료 처리: 최초 1회만 isInitialized=true로 변경
    @Transactional
    public void completeInitialization(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 탈퇴 유저 방지
        if (user.getRemovedAt() != null) {
            throw new CustomException(ErrorCode.USER_DELETED);
        }

        // 멱등 처리
        if (!user.isInitialized()) {
            user.markInitialized();
        }
    }

}