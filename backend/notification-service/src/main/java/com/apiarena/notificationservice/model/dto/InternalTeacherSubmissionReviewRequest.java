package com.apiarena.notificationservice.model.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InternalTeacherSubmissionReviewRequest(
        @NotNull Long userId,
        @NotNull Long submissionId,
        Long challengeId,
        @Size(max = 240) String challengeTitle) {
}
