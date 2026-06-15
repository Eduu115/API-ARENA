package com.apiarena.submissionservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BestPerChallengeStatsDTO {

    /** Average of the best total_score per distinct challenge attempted (0–1000 scale). */
    private Double averageBestScore;

    /** Distinct challenges with at least one submission. */
    private int challengesAttempted;

    /** Max score scale used on the platform (typically 1000). */
    private int maxScoreScale;
}
