package com.apiarena.authservice.model.dto;

import java.time.LocalDateTime;

import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.model.entities.UserStreakState;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicProfileDTO {
    private Long id;
    private String username;
    private String role;
    private String avatarUrl;
    private String bio;
    private String githubUsername;
    private Integer rating;
    private Integer level;
    private Integer experiencePoints;
    private Integer totalChallengesCompleted;
    private Integer totalTestsPassed;
    private LocalDateTime createdAt;
    private Boolean betaLegacy;
    private Integer weeklyStreakCurrent;
    private Integer weeklyStreakLongest;

    public static PublicProfileDTO fromEntity(User user) {
        return fromEntity(user, null);
    }

    public static PublicProfileDTO fromEntity(User user, UserStreakState streakState) {
        return PublicProfileDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole().name())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .githubUsername(user.getGithubUsername())
                .rating(user.getRating())
                .level(user.getLevel())
                .experiencePoints(user.getExperiencePoints())
                .totalChallengesCompleted(user.getTotalChallengesCompleted())
                .totalTestsPassed(user.getTotalTestsPassed())
                .createdAt(user.getCreatedAt())
                .betaLegacy(Boolean.TRUE.equals(user.getBetaLegacy()))
                .weeklyStreakCurrent(streakState != null ? streakState.getCurrentStreakWeeks() : 0)
                .weeklyStreakLongest(streakState != null ? streakState.getLongestStreakWeeks() : 0)
                .build();
    }
}
