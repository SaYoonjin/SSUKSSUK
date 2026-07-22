package com.ssukssuk.service.auth;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.common.security.JwtTokenProvider;
import com.ssukssuk.dto.auth.TokenRefreshRequest;
import com.ssukssuk.repository.auth.RefreshTokenRepository;
import com.ssukssuk.repository.auth.UserRepository;
import com.ssukssuk.repository.plant.UserPlantRepository;
import com.ssukssuk.repository.push.PushTokenRepository;
import com.ssukssuk.service.device.DeviceControlService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private UserPlantRepository userPlantRepository;
    @Mock
    private PushTokenRepository pushTokenRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private DeviceControlService deviceControlService;

    @InjectMocks
    private UserService userService;

    @Test
    void refreshRejectsTokenWhenAnotherRequestAlreadyRevokedIt() {
        String refreshToken = "refresh-token";
        when(jwtTokenProvider.validate(refreshToken)).thenReturn(true);
        when(jwtTokenProvider.getTokenType(refreshToken)).thenReturn("REFRESH");
        when(refreshTokenRepository.revokeIfActive(refreshToken)).thenReturn(0);

        assertThatThrownBy(() ->
                userService.refresh(new TokenRefreshRequest(refreshToken))
        )
                .isInstanceOf(CustomException.class)
                .satisfies(error -> assertThat(((CustomException) error).getErrorCode())
                        .isEqualTo(ErrorCode.UNAUTHORIZED));

        verify(jwtTokenProvider, never()).getUserId(refreshToken);
    }
}
