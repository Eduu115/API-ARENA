package com.apiarena.leaderboardservice.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmitScoreRequest {

    @NotNull
    private Long challengeId;

    @NotNull
    private Long userId;

    @NotNull
    private Long submissionId;

    @NotNull
    private String username;

    @NotNull
    private Integer score;

    private Integer completionTimeSeconds;
}
