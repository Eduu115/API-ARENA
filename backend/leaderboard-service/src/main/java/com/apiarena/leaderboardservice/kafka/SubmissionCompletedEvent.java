package com.apiarena.leaderboardservice.kafka;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Mismo contrato JSON que emite submission-service en {@code apiarena.submissions.completed}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record SubmissionCompletedEvent(
        String eventType,
        Long submissionId,
        Long userId,
        Long challengeId,
        String username,
        Integer score,
        Integer completionTimeSeconds,
        Instant occurredAt
) {
    public static final String TYPE = "SUBMISSION_COMPLETED";
}
