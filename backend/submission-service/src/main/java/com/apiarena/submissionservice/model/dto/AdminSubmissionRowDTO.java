package com.apiarena.submissionservice.model.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.apiarena.submissionservice.model.entities.Submission;

/** Admin console row for a user's submission, including time-to-submit. */
public record AdminSubmissionRowDTO(
        Long id,
        Long challengeId,
        String challengeTitle,
        Long userId,
        String status,
        BigDecimal totalScore,
        Integer developmentTimeSeconds,
        LocalDateTime createdAt,
        LocalDateTime completedAt) {

    public static AdminSubmissionRowDTO fromEntity(Submission s, String challengeTitle) {
        return new AdminSubmissionRowDTO(
                s.getId(),
                s.getChallengeId(),
                challengeTitle,
                s.getUserId(),
                s.getStatus() != null ? s.getStatus().name() : null,
                s.getTotalScore(),
                s.getDevelopmentTimeSeconds(),
                s.getCreatedAt(),
                s.getCompletedAt());
    }
}
