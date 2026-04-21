package com.apiarena.submissionservice.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.apiarena.submissionservice.model.entities.Submission;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    List<Submission> findByChallengeIdOrderByCreatedAtDesc(Long challengeId);

    List<Submission> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Submission> findByUserIdInOrderByCreatedAtDesc(List<Long> userIds);

    List<Submission> findByUserIdAndChallengeIdOrderByCreatedAtDesc(Long userId, Long challengeId);

    long countByUserIdAndChallengeIdAndCreatedAtGreaterThanEqual(Long userId, Long challengeId,
            LocalDateTime createdAtMin);

    Optional<Submission> findFirstByUserIdAndChallengeIdOrderByCreatedAtDesc(Long userId, Long challengeId);

    List<Submission> findByChallengeIdInAndStatusOrderByCompletedAtDescIdDesc(
            Collection<Long> challengeIds,
            Submission.Status status,
            Pageable pageable);

    @Query("SELECT s FROM Submission s WHERE s.userId = :userId AND s.challengeId = :challengeId " +
           "AND s.status = 'COMPLETED' AND s.id <> :excludeId ORDER BY s.totalScore DESC")
    List<Submission> findBestCompletedExcluding(
            @Param("userId") Long userId,
            @Param("challengeId") Long challengeId,
            @Param("excludeId") Long excludeId);
}
