package com.apiarena.challengeservice.model.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.apiarena.challengeservice.model.entities.Challenge;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Public-facing challenge card / detail without technical specs (no test suite, endpoints, hints, etc.).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChallengePreviewDTO {

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
    private Integer xpReward;
    private String origin;
    private Boolean isActive;
    private Boolean featured;
    private Integer timesAttempted;
    private Integer timesCompleted;
    private BigDecimal averageScore;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ChallengePreviewDTO fromEntity(Challenge challenge) {
        ChallengePreviewDTO dto = new ChallengePreviewDTO();
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
        dto.setXpReward(challenge.getXpReward());
        dto.setOrigin(challenge.getOrigin() != null ? challenge.getOrigin().name() : "LEGACY");
        dto.setIsActive(challenge.getIsActive());
        dto.setFeatured(challenge.getFeatured());
        dto.setTimesAttempted(challenge.getTimesAttempted());
        dto.setTimesCompleted(challenge.getTimesCompleted());
        dto.setAverageScore(challenge.getAverageScore());
        dto.setCreatedAt(challenge.getCreatedAt());
        dto.setUpdatedAt(challenge.getUpdatedAt());
        return dto;
    }
}
