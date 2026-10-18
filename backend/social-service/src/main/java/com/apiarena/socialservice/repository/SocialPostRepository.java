package com.apiarena.socialservice.repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.apiarena.socialservice.model.entity.SocialPost;

public interface SocialPostRepository extends JpaRepository<SocialPost, Long> {

    Optional<SocialPost> findBySubmissionId(Long submissionId);

    @Query("""
            SELECT p FROM SocialPost p
            WHERE p.userId IN :ids AND p.hidden = false AND p.createdAt <= :cursorAt
            ORDER BY p.createdAt DESC, p.id DESC
            """)
    List<SocialPost> page(
            @Param("ids") Collection<Long> ids,
            @Param("cursorAt") Instant cursorAt,
            Pageable pageable);

    List<SocialPost> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT p.id FROM SocialPost p WHERE p.userId = :userId")
    List<Long> findIdsByUserId(@Param("userId") Long userId);

    void deleteByUserId(Long userId);
}
