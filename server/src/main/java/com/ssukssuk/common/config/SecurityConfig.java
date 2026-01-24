package com.ssukssuk.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.common.security.JwtAuthenticationFilter;
import com.ssukssuk.common.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.nio.charset.StandardCharsets;

@RequiredArgsConstructor
@Configuration
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(jwtTokenProvider);

        return http
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())

                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) -> writeError(res, ErrorCode.UNAUTHORIZED))
                        .accessDeniedHandler((req, res, e) -> writeError(res, ErrorCode.FORBIDDEN))
                )

                .authorizeHttpRequests(auth -> auth
                        // 회원가입/로그인 + swagger는 열어두기
                        .requestMatchers(
                                "/auth/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/test/**"
                        ).permitAll()

                        .anyRequest().authenticated()
                )

                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)

                .build();
    }

    private void writeError(HttpServletResponse res, ErrorCode errorCode) {
        try {
            res.setStatus(errorCode.getHttpStatus().value());
            res.setCharacterEncoding(StandardCharsets.UTF_8.name());
            res.setContentType(MediaType.APPLICATION_JSON_VALUE);

            ApiResponse<Void> body =
                    ApiResponse.fail(errorCode.getCode(), errorCode.getMessage());

            res.getWriter().write(objectMapper.writeValueAsString(body));
        } catch (Exception ignore) {
        }
    }
}