package com.apiarena.leaderboardservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GlobalLeaderboardDTO {

    private Long userId;
    private String username;
    private Integer totalScore;
    private Integer challengesCompleted;
    private Integer rank;
}
