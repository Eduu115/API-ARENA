package com.apiarena.authservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RewardRequest {
    private Integer xpEarned;
    private Integer eloChange;
    private Boolean isFirstCompletion;
    /** Challenge completed (for weekly streak path B). */
    private Long challengeId;
    /** Pipeline total score before teacher adjustments (0–1000). */
    private Integer pipelineTotalScore;
}
