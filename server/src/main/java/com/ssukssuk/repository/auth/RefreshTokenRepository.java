package com.ssukssuk.repository.auth;

import com.ssukssuk.domain.auth.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    void deleteByUser_Id(Long userId);

    /**
     * 같은 Refresh Token으로 재발급 요청이 동시에 들어와도
     * 아직 폐기되지 않은 토큰을 먼저 갱신한 요청 하나만 성공한다.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
    update RefreshToken rt
    set rt.revoked = true
    where rt.token = :token
      and rt.revoked = false
    """)
    int revokeIfActive(@Param("token") String token);

    @Modifying
    @Query("""
    update RefreshToken rt
    set rt.revoked = true
    where rt.user.id = :userId
    """)
    void revokeAllByUserId(@Param("userId") Long userId);

}
