package com.apiarena.challengeservice.model.dto;

import java.math.BigDecimal;

import com.apiarena.challengeservice.model.entities.Challenge;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder

public class ChallengeSummaryDTO {
    
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
    private Boolean featured;
    private Integer timesAttempted;
    private Integer timesCompleted;
    private BigDecimal averageScore;

    public static ChallengeSummaryDTO fromEntity(Challenge challenge) {
        ChallengeSummaryDTO dto = new ChallengeSummaryDTO();
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
        dto.setFeatured(challenge.getFeatured());
        dto.setTimesAttempted(challenge.getTimesAttempted());
        dto.setTimesCompleted(challenge.getTimesCompleted());
        dto.setAverageScore(challenge.getAverageScore());
        
        return dto;
    }
}