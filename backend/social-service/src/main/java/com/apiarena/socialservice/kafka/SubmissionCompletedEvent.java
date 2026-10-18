package com.apiarena.socialservice.kafka;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
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
