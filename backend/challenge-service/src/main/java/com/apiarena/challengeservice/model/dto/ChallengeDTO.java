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
    private Long categoryId;
    private String categoryIcon;
    private String categoryColor;
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
        ChallengeDTO dto = new ChallengeDTO();
        dto.setId(challenge.getId());
        dto.setTitle(challenge.getTitle());
        dto.setSlug(challenge.getSlug());
        dto.setDescription(challenge.getDescription());
        dto.setDifficulty(challenge.getDifficulty().name());
        
        if (challenge.getCategory() != null) {
            dto.setCategory(challenge.getCategory().getName());
            dto.setCategoryId(challenge.getCategory().getId());
            dto.setCategoryIcon(challenge.getCategory().getIcon());
            dto.setCategoryColor(challenge.getCategory().getColor());
        }
        
        dto.setMaxScore(challenge.getMaxScore());
        dto.setTimeLimitMinutes(challenge.getTimeLimitMinutes());
        dto.setRequiredEndpoints(challenge.getRequiredEndpoints());
        dto.setRequiredStatusCodes(challenge.getRequiredStatusCodes());
        dto.setRequiredHeaders(challenge.getRequiredHeaders());
        dto.setTestSuite(challenge.getTestSuite());
        dto.setPerformanceRequirements(challenge.getPerformanceRequirements());
        dto.setDesignCriteria(challenge.getDesignCriteria());
        dto.setCreatedBy(challenge.getCreatedBy());
        dto.setCreatedAt(challenge.getCreatedAt());
        dto.setUpdatedAt(challenge.getUpdatedAt());
        dto.setIsActive(challenge.getIsActive());
        dto.setFeatured(challenge.getFeatured());
        dto.setTimesAttempted(challenge.getTimesAttempted());
        dto.setTimesCompleted(challenge.getTimesCompleted());
        dto.setAverageScore(challenge.getAverageScore());
        dto.setHints(challenge.getHints());
        dto.setSolutionExplanation(challenge.getSolutionExplanation());
        dto.setLearningObjectives(challenge.getLearningObjectives());
        
        return dto;
    }
}