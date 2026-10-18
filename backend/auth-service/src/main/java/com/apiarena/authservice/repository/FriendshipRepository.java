package com.apiarena.authservice.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.apiarena.authservice.model.entities.Friendship;
import com.apiarena.authservice.model.entities.FriendshipStatus;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    Optional<Friendship> findByUserLowIdAndUserHighId(Long userLowId, Long userHighId);

    @Query("SELECT f FROM Friendship f WHERE f.status = :status "
            + "AND (f.userLowId = :uid OR f.userHighId = :uid)")
    List<Friendship> findByUserInvolvedAndStatus(
            @Param("uid") Long userId,
            @Param("status") FriendshipStatus status);

    @Query("SELECT f FROM Friendship f WHERE f.userLowId = :uid OR f.userHighId = :uid")
    List<Friendship> findAllByUserInvolved(@Param("uid") Long userId);

    @Query("""
            SELECT CASE WHEN f.userLowId = :uid THEN f.userHighId ELSE f.userLowId END
            FROM Friendship f
            WHERE f.status = :status AND (f.userLowId = :uid OR f.userHighId = :uid)
            """)
    List<Long> findAcceptedPeerIds(@Param("uid") Long userId, @Param("status") FriendshipStatus status);
}
