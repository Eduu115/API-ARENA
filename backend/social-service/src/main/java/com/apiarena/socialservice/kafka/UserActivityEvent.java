package com.apiarena.socialservice.kafka;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record UserActivityEvent(
        String eventType,
        String sourceEventId,
        Long userId,
        String activityType,
        Long challengeId,
        String challengeTitle,
        Integer score,
        Integer previousValue,
        Integer newValue,
        Integer delta,
        String labelBefore,
        String labelAfter,
        String achievementCode,
        String achievementTitle,
        Integer streakWeeks,
        Instant occurredAt
) {
    public static final String TYPE = "USER_ACTIVITY";
}
