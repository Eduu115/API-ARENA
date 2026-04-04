package com.apiarena.notificationservice.kafka;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Mismo contrato JSON que emite submission-service en {@code apiarena.submissions.completed}.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record SubmissionCompletedEvent(
        String eventType,
        Long submissionId,
        Long userId,
        Long challengeId,
        String challengeTitle,
        String username,
        Integer score,
        Integer completionTimeSeconds,
        Instant occurredAt
) {
    public static final String TYPE = "SUBMISSION_COMPLETED";
}
