package com.ssukssuk.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.common.response.ApiResponse;
import com.ssukssuk.common.security.JwtAuthenticationFilter;
import com.ssukssuk.common.security.JwtTokenProvider;
import com.ssukssuk.repository.auth.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

import java.nio.charset.StandardCharsets;

@RequiredArgsConstructor
@Configuration
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(jwtTokenProvider, userRepository);

        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())

                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) -> writeError(res, ErrorCode.UNAUTHORIZED))
                        .accessDeniedHandler((req, res, e) -> writeError(res, ErrorCode.FORBIDDEN))
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/api/auth/login",
                                "/api/auth/signup",
                                "/api/auth/refresh",
                                "/api/test/**",
                                "/test/**",
                                "/actuator/**",
                                "/api/fcm/token",
                                "/api/admin/**"
                        ).permitAll()
                        .requestMatchers("/api/auth/logout").authenticated()
                        .anyRequest().authenticated()
                )

                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)

                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",
                "http://localhost:5173",
                "https://i14a103.p.ssafy.io"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
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