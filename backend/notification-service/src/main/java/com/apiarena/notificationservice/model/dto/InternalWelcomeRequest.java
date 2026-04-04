package com.apiarena.notificationservice.model.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Service-to-service payload to create the one-time welcome notification after registration.
 */
public record InternalWelcomeRequest(
        @NotNull Long userId,
        String username
) {}
