package com.apiarena.submissionservice.model.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.apiarena.submissionservice.model.entities.Submission;
import com.fasterxml.jackson.annotation.JsonInclude;

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
    /**
     * UTC instant (ISO-8601) after which the stored ZIP is considered past the configured retention window
     * (informational; ops may delete earlier or later). Null if no ZIP was stored.
     */
    private String zipDownloadExpiresAt;
    /** Public username when resolved (e.g. teacher challenge-wide submission list); may be null. */
    private String submitterUsername;

    /**
     * When listing for teachers: true if the teacher has applied manual grading, penalties, review notes,
     * structured feedback, or score bonuses on this submission. Omitted for student-only lists.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean teacherCorrectionComplete;

    public static SubmissionSummaryDTO fromEntity(Submission entity) {
        return fromEntity(entity, null, null, null);
    }

    public static SubmissionSummaryDTO fromEntity(Submission entity, String challengeTitle) {
        return fromEntity(entity, challengeTitle, null, null);
    }

    public static SubmissionSummaryDTO fromEntity(Submission entity, String challengeTitle, String zipDownloadExpiresAt) {
        return fromEntity(entity, challengeTitle, zipDownloadExpiresAt, null);
    }

    public static SubmissionSummaryDTO fromEntity(Submission entity, String challengeTitle, String zipDownloadExpiresAt,
            String submitterUsername) {
        return new SubmissionSummaryDTO(
                entity.getId(),
                entity.getChallengeId(),
                entity.getUserId(),
                entity.getStatus().name(),
                entity.getTotalScore(),
                entity.getCreatedAt(),
                entity.getCompletedAt(),
                challengeTitle,
                zipDownloadExpiresAt,
                submitterUsername,
                null
        );
    }
}
