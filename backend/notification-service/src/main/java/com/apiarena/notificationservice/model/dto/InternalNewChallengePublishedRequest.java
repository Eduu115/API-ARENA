package com.apiarena.notificationservice.model.dto;

import jakarta.validation.constraints.NotNull;

public record InternalNewChallengePublishedRequest(
        @NotNull Long userId,
        @NotNull Long challengeId,
        String challengeTitle,
        String locale
) {}
