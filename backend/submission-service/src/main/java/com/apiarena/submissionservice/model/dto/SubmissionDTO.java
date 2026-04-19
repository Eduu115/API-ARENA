package com.apiarena.submissionservice.model.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import com.apiarena.submissionservice.model.entities.Submission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionDTO {

    private Long id;
    private Long challengeId;
    private Long userId;
    private String status;
    private String errorMessage;
    private BigDecimal totalScore;
    private BigDecimal correctnessScore;
    private BigDecimal performanceScore;
    private BigDecimal designScore;
    private BigDecimal aiReviewScore;
    private Integer avgResponseMs;
    private Integer p95ResponseMs;
    private Integer p99ResponseMs;
    private Integer rps;
    private Integer totalRequests;
    private Integer failedRequests;
    private BigDecimal restComplianceScore;
    private Map<String, Object> aiSuggestions;
    private Integer xpEarned;
    private Integer eloChange;
    private BigDecimal previousBestScore;
    private Boolean isFirstCompletion;
    private Integer developmentTimeSeconds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
    private String wsTopic;

    private List<Map<String, Object>> teacherPenalties;
    private Boolean teacherManualGrading;
    /** Populated for the current viewer when they are an eligible teacher. */
    private Boolean teacherCanApplyPenalty;
    private Boolean teacherCanManualGrade;
    private Boolean teacherCanEditSubmissionReview;

    private String teacherPersonalNote;
    private Map<String, String> teacherZoneNotes;
    private Map<String, Object> teacherStructuredFeedback;
    private List<Map<String, Object>> teacherScoreBonuses;

    public static SubmissionDTO fromEntity(Submission entity, String wsTopic) {
        return SubmissionDTO.builder()
                .id(entity.getId())
                .challengeId(entity.getChallengeId())
                .userId(entity.getUserId())
                .status(entity.getStatus().name())
                .errorMessage(entity.getErrorMessage())
                .totalScore(entity.getTotalScore())
                .correctnessScore(entity.getCorrectnessScore())
                .performanceScore(entity.getPerformanceScore())
                .designScore(entity.getDesignScore())
                .aiReviewScore(entity.getAiReviewScore())
                .avgResponseMs(entity.getAvgResponseMs())
                .p95ResponseMs(entity.getP95ResponseMs())
                .p99ResponseMs(entity.getP99ResponseMs())
                .rps(entity.getRps())
                .totalRequests(entity.getTotalRequests())
                .failedRequests(entity.getFailedRequests())
                .restComplianceScore(entity.getRestComplianceScore())
                .aiSuggestions(entity.getAiSuggestions())
                .xpEarned(entity.getXpEarned())
                .eloChange(entity.getEloChange())
                .previousBestScore(entity.getPreviousBestScore())
                .isFirstCompletion(entity.getIsFirstCompletion())
                .developmentTimeSeconds(entity.getDevelopmentTimeSeconds())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .completedAt(entity.getCompletedAt())
                .wsTopic(wsTopic)
                .teacherPenalties(entity.getTeacherPenalties() != null
                        ? entity.getTeacherPenalties() : Collections.emptyList())
                .teacherManualGrading(entity.getTeacherManualGrading())
                .teacherCanApplyPenalty(false)
                .teacherCanManualGrade(false)
                .teacherCanEditSubmissionReview(false)
                .teacherPersonalNote(entity.getTeacherPersonalNote())
                .teacherZoneNotes(entity.getTeacherZoneNotes() != null
                        ? entity.getTeacherZoneNotes() : Collections.emptyMap())
                .teacherStructuredFeedback(entity.getTeacherStructuredFeedback())
                .teacherScoreBonuses(entity.getTeacherScoreBonuses() != null
                        ? entity.getTeacherScoreBonuses() : Collections.emptyList())
                .build();
    }
}
