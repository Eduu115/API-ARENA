package com.apiarena.submissionservice.model.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.apiarena.submissionservice.model.entities.Submission;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionSummaryDTO {

    private Long id;
    private Long challengeId;
    private Long userId;
    private String status;
    private BigDecimal totalScore;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    /** Resolved from challenge-service when listing; may be null if unavailable. */
    private String challengeTitle;

    public static SubmissionSummaryDTO fromEntity(Submission entity) {
        return fromEntity(entity, null);
    }

    public static SubmissionSummaryDTO fromEntity(Submission entity, String challengeTitle) {
        return new SubmissionSummaryDTO(
                entity.getId(),
                entity.getChallengeId(),
                entity.getUserId(),
                entity.getStatus().name(),
                entity.getTotalScore(),
                entity.getCreatedAt(),
                entity.getCompletedAt(),
                challengeTitle
        );
    }
}
