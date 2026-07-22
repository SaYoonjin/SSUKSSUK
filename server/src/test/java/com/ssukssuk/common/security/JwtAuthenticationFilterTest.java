package com.ssukssuk.common.security;

import com.ssukssuk.repository.auth.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class JwtAuthenticationFilterTest {

    private static final String SECRET =
            "test-secret-key-that-is-long-enough-for-hs256-signing-1234567890";

    private final JwtTokenProvider tokenProvider =
            new JwtTokenProvider(SECRET, 900_000L, 1_209_600_000L, "test");
    private final UserRepository userRepository = mock(UserRepository.class);
    private final JwtAuthenticationFilter filter =
            new JwtAuthenticationFilter(tokenProvider, userRepository);

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void accessTokenAuthenticatesApiRequest() throws Exception {
        String accessToken = tokenProvider.createAccessToken(
                1L, "user@example.com", false
        );

        filter.doFilter(
                requestWithBearer(accessToken),
                new MockHttpServletResponse(),
                new MockFilterChain()
        );

        assertThat(SecurityContextHolder.getContext().getAuthentication())
                .isNotNull();
    }

    @Test
    void refreshTokenDoesNotAuthenticateApiRequest() throws Exception {
        String refreshToken = tokenProvider.createRefreshToken(1L);

        filter.doFilter(
                requestWithBearer(refreshToken),
                new MockHttpServletResponse(),
                new MockFilterChain()
        );

        assertThat(SecurityContextHolder.getContext().getAuthentication())
                .isNull();
    }

    private MockHttpServletRequest requestWithBearer(String token) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/users/me");
        request.addHeader("Authorization", "Bearer " + token);
        return request;
    }
}
