package com.ssukssuk.common.security;

import com.ssukssuk.common.exception.CustomException;
import com.ssukssuk.common.exception.ErrorCode;
import com.ssukssuk.repository.auth.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(
            JwtTokenProvider tokenProvider,
            UserRepository userRepository
    ) {
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
    }


    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        return path.startsWith("/test/")
                || path.startsWith("/swagger-ui/")
                || path.startsWith("/v3/api-docs/")
                || path.equals("/auth/login")
                || path.equals("/auth/signup")
                || path.equals("/auth/refresh");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String token = resolveBearerToken(request);

        if (token != null && tokenProvider.validate(token)) {
            Long userId = tokenProvider.getUserId(token);

            if (userRepository.isWithdrawn(userId)) {
                throw new CustomException(ErrorCode.USER_DELETED);
            }

            boolean isAdmin = tokenProvider.isAdmin(token);

            List<SimpleGrantedAuthority> authorities =
                    isAdmin
                            ? List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                            : List.of(new SimpleGrantedAuthority("ROLE_USER"));

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, authorities);

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String resolveBearerToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (!StringUtils.hasText(header)) return null;

        if (header.startsWith("Bearer ")) {
            String token = header.substring(7);
            return StringUtils.hasText(token) ? token : null;
        }
        return null;
    }
}