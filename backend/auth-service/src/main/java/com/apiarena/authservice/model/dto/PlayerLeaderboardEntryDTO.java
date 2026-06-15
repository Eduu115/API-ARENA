package com.apiarena.authservice.model.dto;

import com.apiarena.authservice.model.entities.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerLeaderboardEntryDTO {

    private Long userId;
    private String username;
    private Integer rank;
    private Integer rating;
    private Integer level;
    private Integer experiencePoints;
    private Integer totalChallengesCompleted;

    public static PlayerLeaderboardEntryDTO fromUser(User user, int rank) {
        return PlayerLeaderboardEntryDTO.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .rank(rank)
                .rating(user.getRating())
                .level(user.getLevel())
                .experiencePoints(user.getExperiencePoints())
                .totalChallengesCompleted(user.getTotalChallengesCompleted())
                .build();
    }
}
