package com.apiarena.submissionservice.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.apiarena.submissionservice.model.entities.Submission;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    List<Submission> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Submission> findByUserIdAndChallengeIdOrderByCreatedAtDesc(Long userId, Long challengeId);
}
