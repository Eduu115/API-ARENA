package com.apiarena.challengeservice.model.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

import com.apiarena.challengeservice.model.entities.Challenge;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder

public class ChallengeDTO {

    private Long id;
    private String title;
    private String slug;
    private String description;
    private String difficulty;
    private String category;
    private Integer maxScore;
    private Integer timeLimitMinutes;
    private Map<String, Object> requiredEndpoints;
    private Map<String, Object> requiredStatusCodes;
    private Map<String, Object> requiredHeaders;
    private Map<String, Object> testSuite;
    private Map<String, Object> performanceRequirements;
    private Map<String, Object> designCriteria;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isActive;
    private Boolean featured;
    private Integer timesAttempted;
    private Integer timesCompleted;
    private BigDecimal averageScore;
    private Map<String, Object> hints;
    private String solutionExplanation;
    private Map<String, Object> learningObjectives;

    public static ChallengeDTO fromEntity(Challenge challenge) {
        return new ChallengeDTO(
            challenge.getId(),  
            challenge.getTitle(),
            challenge.getSlug(),
            challenge.getDescription(),
            challenge.getDifficulty().name(),
            challenge.getCategory(),
            challenge.getMaxScore(),
            challenge.getTimeLimitMinutes(),
            challenge.getRequiredEndpoints(),
            challenge.getRequiredStatusCodes(),
            challenge.getRequiredHeaders(),
            challenge.getTestSuite(),
            challenge.getPerformanceRequirements(),
            challenge.getDesignCriteria(),
            challenge.getCreatedBy(),
            challenge.getCreatedAt(),
            challenge.getUpdatedAt(),
            challenge.getIsActive(),
            challenge.getFeatured(),
            challenge.getTimesAttempted(),
            challenge.getTimesCompleted(),
            challenge.getAverageScore(),
            challenge.getHints(),
            challenge.getSolutionExplanation(),
            challenge.getLearningObjectives()
        );
    }
}