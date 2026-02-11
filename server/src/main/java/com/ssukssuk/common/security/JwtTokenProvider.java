package com.ssukssuk.common.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;
    private final String issuer;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration-ms}") long accessTokenExpirationMs,
            @Value("${jwt.refresh-token-expiration-ms}") long refreshTokenExpirationMs,
            @Value("${jwt.issuer}") String issuer
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
        this.issuer = issuer;
    }

    /** AccessToken 발급 */
    public String createAccessToken(Long userId, String email, boolean isAdmin) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenExpirationMs);

        return Jwts.builder()
                .issuer(issuer)
                .issuedAt(now)
                .expiration(expiry)
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("admin", isAdmin)
                .claim("type", "ACCESS")
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    /** RefreshToken 발급 */
    public String createRefreshToken(Long userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshTokenExpirationMs);

        return Jwts.builder()
                .issuer(issuer)
                .issuedAt(now)
                .expiration(expiry)
                .subject(String.valueOf(userId))
                .claim("type", "REFRESH")
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    /** 토큰 유효성 검증 (서명/만료 포함) */
    public boolean validate(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /** userId 추출 */
    public Long getUserId(String token) {
        Claims claims = parseClaims(token);
        return Long.parseLong(claims.getSubject());
    }

    /** admin 추출 */
    public boolean isAdmin(String token) {
        Claims claims = parseClaims(token);
        Object val = claims.get("admin");
        return val instanceof Boolean b && b;
    }

    /** email 추출(필요할 때) */
    public String getEmail(String token) {
        Claims claims = parseClaims(token);
        Object val = claims.get("email");
        return val == null ? null : String.valueOf(val);
    }

    /** 토큰 타입 확인(ACCESS/REFRESH) */
    public String getTokenType(String token) {
        Claims claims = parseClaims(token);
        Object val = claims.get("type");
        return val == null ? null : String.valueOf(val);
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public LocalDateTime getRefreshTokenExpiry() {
        return LocalDateTime.now()
                .plusSeconds(refreshTokenExpirationMs / 1000);
    }

    public long getAccessTokenExpiresInSeconds() {
        return accessTokenExpirationMs / 1000;
    }
}