package com.apiarena.authservice.model.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.apiarena.authservice.model.entities.AdminCapability;
import com.apiarena.authservice.model.entities.User;

import lombok.Builder;
import lombok.Data;

/** Full admin-console view of a user (used for both the search rows and the detail page). */
@Data
@Builder
public class AdminUserDTO {
    private Long id;
    private String username;
    private String email;
    private String role;
    /** Only populated for ADMIN accounts: which admin capabilities they hold (empty = none, both = supreme). */
    private List<AdminCapability> capabilities;
    private Boolean isActive;
    private Boolean emailVerified;
    private Boolean totpEnabled;
    private Integer warnings;
    private String banReason;
    private LocalDateTime bannedAt;
    private LocalDateTime bannedUntil;
    private Integer rating;
    private Integer level;
    private Integer experiencePoints;
    private Integer totalChallengesCompleted;
    private Integer totalTestsPassed;
    private Long totalDevelopmentSeconds;
    private Long totalBrowsingSeconds;
    private String avatarUrl;
    private String bio;
    private String githubUsername;
    private Boolean betaLegacy;
    private LocalDateTime lastLogin;
    private LocalDateTime lastSeenAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AdminUserDTO fromEntity(User u) {
        return AdminUserDTO.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole() != null ? u.getRole().name() : null)
                .isActive(u.getIsActive())
                .emailVerified(u.getEmailVerified())
                .totpEnabled(u.getTotpEnabled())
                .warnings(u.getWarnings())
                .banReason(u.getBanReason())
                .bannedAt(u.getBannedAt())
                .bannedUntil(u.getBannedUntil())
                .rating(u.getRating())
                .level(u.getLevel())
                .experiencePoints(u.getExperiencePoints())
                .totalChallengesCompleted(u.getTotalChallengesCompleted())
                .totalTestsPassed(u.getTotalTestsPassed())
                .totalDevelopmentSeconds(u.getTotalDevelopmentSeconds())
                .totalBrowsingSeconds(u.getTotalBrowsingSeconds())
                .avatarUrl(u.getAvatarUrl())
                .bio(u.getBio())
                .githubUsername(u.getGithubUsername())
                .betaLegacy(u.getBetaLegacy())
                .lastLogin(u.getLastLogin())
                .lastSeenAt(u.getLastSeenAt())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }
}
