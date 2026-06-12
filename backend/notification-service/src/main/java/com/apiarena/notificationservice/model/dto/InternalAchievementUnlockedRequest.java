package com.apiarena.notificationservice.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Service-to-service payload when a user unlocks an achievement.
 */
public record InternalAchievementUnlockedRequest(
        @NotNull Long userId,
        @NotBlank String achievementCode,
        @NotBlank String achievementTitle,
        String tier
) {}
