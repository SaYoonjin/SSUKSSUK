package com.ssukssuk.repository.auth;

import com.ssukssuk.domain.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);
    Optional<User> findByEmail(String email);

    @Query("""
    select (count(u) > 0)
    from User u
    where u.id = :userId
      and u.removedAt is not null
    """)
    boolean isWithdrawn(@Param("userId") Long userId);
}