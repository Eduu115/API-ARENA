package com.apiarena.authservice.model.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Service-to-service: mirror an in-app notification to email (same title/body).
 */
public record InternalNotificationEmailRequest(
        @NotBlank String title,
        String body,
        @NotBlank String importance
) {}
