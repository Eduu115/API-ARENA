package com.apiarena.notificationservice.model.dto;

import jakarta.validation.constraints.NotNull;

public record InternalFriendPostRequest(
        @NotNull Long recipientUserId,
        @NotNull Long authorUserId,
        String authorUsername,
        @NotNull Long postId,
        String challengeTitle
) {
}
