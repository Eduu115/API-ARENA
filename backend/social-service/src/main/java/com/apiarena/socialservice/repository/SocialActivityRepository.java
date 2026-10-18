package com.apiarena.socialservice.repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.apiarena.socialservice.model.entity.SocialActivityEntry;

public interface SocialActivityRepository extends JpaRepository<SocialActivityEntry, Long> {

    boolean existsBySourceEventId(String sourceEventId);

    @Query("""
            SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
            FROM SocialActivityEntry a
            WHERE a.userId = :userId AND a.challengeId = :challengeId
              AND a.activityType = :activityType AND a.sourceEventId <> :source
            """)
    boolean existsOther(
            @Param("userId") Long userId,
            @Param("challengeId") Long challengeId,
            @Param("activityType") String activityType,
            @Param("source") String source);

    @Query("""
            SELECT MAX(a.score) FROM SocialActivityEntry a
            WHERE a.userId = :userId AND a.challengeId = :challengeId
              AND a.activityType = :activityType AND a.sourceEventId <> :source
            """)
    Integer maxScoreExcluding(
            @Param("userId") Long userId,
            @Param("challengeId") Long challengeId,
            @Param("activityType") String activityType,
            @Param("source") String source);

    @Query("""
            SELECT a FROM SocialActivityEntry a
            WHERE a.userId IN :ids AND a.hidden = false
              AND NOT EXISTS (
                SELECT p FROM SocialPrivacySetting p
                WHERE p.userId = a.userId AND p.activityVisibility = 'PRIVATE')
              AND a.createdAt <= :cursorAt
            ORDER BY a.createdAt DESC, a.id DESC
            """)
    List<SocialActivityEntry> page(
            @Param("ids") Collection<Long> ids,
            @Param("cursorAt") Instant cursorAt,
            Pageable pageable);

    List<SocialActivityEntry> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT a.id FROM SocialActivityEntry a WHERE a.userId = :userId")
    List<Long> findIdsByUserId(@Param("userId") Long userId);

    void deleteByUserId(Long userId);
}
