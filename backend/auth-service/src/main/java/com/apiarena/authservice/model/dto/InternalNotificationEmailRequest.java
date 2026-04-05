package com.apiarena.authservice.model.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Service-to-service: send a notification email for ALERTS / IMPORTANT in-app messages.
 */
public record InternalNotificationEmailRequest(
        @NotBlank String title,
        @NotBlank String body,
        @NotBlank String importance
) {}
