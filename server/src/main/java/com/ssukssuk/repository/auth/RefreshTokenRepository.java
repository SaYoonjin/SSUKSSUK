package com.ssukssuk.repository.auth;

import com.ssukssuk.domain.auth.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    void deleteByUser_Id(Long userId);

    @Modifying
    @Query("""
    update RefreshToken rt
    set rt.revoked = true
    where rt.user.id = :userId
    """)
    void revokeAllByUserId(@Param("userId") Long userId);

}
