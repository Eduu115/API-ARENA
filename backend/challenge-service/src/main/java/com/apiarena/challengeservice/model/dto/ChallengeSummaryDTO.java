package com.apiarena.challengeservice.model.dto;

import java.math.BigDecimal;

import com.apiarena.challengeservice.model.entities.Challenge;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder

public class ChallengeSummaryDTO {
    
    // Para mostrar en la lista de challenges: ESTA LISTA ES MAS LIGERA QUE EL DTO COMPLETO, ES PARA MANEJAR LISTAS/LISTADOS DE CHALLENGES
    
    private Long id;
    private String title;
    private String slug;
    private String description;
    private String difficulty;
    private String category;
    private Integer maxScore;
    private Integer timeLimitMinutes;
    private Boolean featured;
    private Integer timesAttempted;
    private Integer timesCompleted;
    private BigDecimal averageScore;

    public static ChallengeSummaryDTO fromEntity(Challenge challenge) {
        return new ChallengeSummaryDTO(
            challenge.getId(),
            challenge.getTitle(),
            challenge.getSlug(),
            challenge.getDescription(),
            challenge.getDifficulty().name(),
            challenge.getCategory(),
            challenge.getMaxScore(),
            challenge.getTimeLimitMinutes(),
            challenge.getFeatured(),
            challenge.getTimesAttempted(),
            challenge.getTimesCompleted(),
            challenge.getAverageScore()
        );
    }
}