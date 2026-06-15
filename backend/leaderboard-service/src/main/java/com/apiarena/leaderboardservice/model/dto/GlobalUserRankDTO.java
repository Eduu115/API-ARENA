package com.apiarena.leaderboardservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GlobalUserRankDTO {

    private Long userId;
    private Integer rank;
    private Integer totalScore;
    private Integer challengesCompleted;

    public boolean isInTop25() {
        return rank != null && rank > 0 && rank <= 25;
    }
}
