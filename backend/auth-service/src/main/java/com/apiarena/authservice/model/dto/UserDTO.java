package com.apiarena.authservice.model.dto;

import java.time.LocalDateTime;

import com.apiarena.authservice.model.entities.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder

public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String role;
    private String avatarUrl;
    private String bio;
    private String githubUsername;
    private Integer rating;
    private Integer level;
    private Integer experiencePoints;
    private Integer totalChallengesCompleted;
    private Integer totalTestsPassed;
    private Long totalDevelopmentSeconds;
    private Long totalBrowsingSeconds;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private Boolean isActive;
    private Boolean emailVerified;
    private Boolean betaLegacy;
    private Boolean newChallengeEmailAlerts;

    public static UserDTO fromEntity(User user) {
        return new UserDTO(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getRole().name(),
            user.getAvatarUrl(),
            user.getBio(),
            user.getGithubUsername(),
            user.getRating(),
            user.getLevel(),
            user.getExperiencePoints(),
            user.getTotalChallengesCompleted(),
            user.getTotalTestsPassed(),
            user.getTotalDevelopmentSeconds() != null ? user.getTotalDevelopmentSeconds() : 0L,
            user.getTotalBrowsingSeconds() != null ? user.getTotalBrowsingSeconds() : 0L,
            user.getCreatedAt(),
            user.getLastLogin(),
            user.getIsActive(),
            user.getEmailVerified(),
            Boolean.TRUE.equals(user.getBetaLegacy()),
            Boolean.TRUE.equals(user.getNewChallengeEmailAlerts())
        );
    }
}
