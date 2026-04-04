package com.apiarena.submissionservice.kafka;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Publicado en {@code apiarena.submissions.completed} cuando una submission termina COMPLETED
 * y se han calculado recompensas (antes de notificar a auth).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
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

    public static SubmissionCompletedEvent of(
            Long submissionId,
            Long userId,
            Long challengeId,
            String username,
            int score,
            Integer completionTimeSeconds
    ) {
        return new SubmissionCompletedEvent(
                TYPE,
                submissionId,
                userId,
                challengeId,
                username,
                score,
                completionTimeSeconds,
                Instant.now()
        );
    }
}
