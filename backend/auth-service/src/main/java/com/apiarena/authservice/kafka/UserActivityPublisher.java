package com.apiarena.authservice.kafka;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class UserActivityPublisher {

    private static final Logger log = LoggerFactory.getLogger(UserActivityPublisher.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final int eloThreshold;
    private final String topic;

    public UserActivityPublisher(
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper,
            @Value("${app.social.enabled:false}") boolean enabled,
            @Value("${app.social.elo-delta-threshold:25}") int eloThreshold,
            @Value("${apiarena.kafka.topic.user-activity:apiarena.user.activity}") String topic) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.eloThreshold = eloThreshold;
        this.topic = topic;
    }

    public void elo(Long userId, Long submissionId, Long challengeId, int before, int after) {
        int delta = after - before;
        if (Math.abs(delta) < eloThreshold) {
            return;
        }
        String source = submissionId != null
                ? "auth:reward:" + submissionId + ":elo"
                : "auth:reward:" + userId + ":elo:" + before + ":" + after;
        send(source, userId, "ELO_CHANGE", challengeId, null, before, after, delta, null, null, null, null, null);
    }

    public void level(Long userId, Long submissionId, int before, int after) {
        if (before == after) {
            return;
        }
        String source = submissionId != null
                ? "auth:reward:" + submissionId + ":level"
                : "auth:reward:" + userId + ":level:" + after;
        send(source, userId, "LEVEL_UP", null, null, before, after, after - before, null, null, null, null, null);
    }

    public void tier(Long userId, Long submissionId, String before, String after) {
        if (before == null || before.equals(after)) {
            return;
        }
        String source = submissionId != null
                ? "auth:reward:" + submissionId + ":tier"
                : "auth:reward:" + userId + ":tier:" + after;
        send(source, userId, "TIER_UP", null, null, null, null, null, before, after, null, null, null);
    }

    public void achievement(Long userId, String code, String title) {
        if (userId == null || code == null || code.isBlank()) {
            return;
        }
        send("auth:achievement:" + userId + ":" + code.trim(), userId, "ACHIEVEMENT",
                null, null, null, null, null, null, null, code.trim(), title, null);
    }

    public void streak(Long userId, int weeks, int isoYear, int isoWeek) {
        send("auth:streak:" + userId + ":" + isoYear + "-W" + isoWeek, userId, "WEEKLY_STREAK",
                null, null, null, weeks, null, null, null, null, null, weeks);
    }

    private void send(
            String sourceEventId,
            Long userId,
            String activityType,
            Long challengeId,
            String challengeTitle,
            Integer previous,
            Integer next,
            Integer delta,
            String labelBefore,
            String labelAfter,
            String achievementCode,
            String achievementTitle,
            Integer streakWeeks) {
        if (!enabled || userId == null) {
            return;
        }
        UserActivityEvent event = new UserActivityEvent(
                UserActivityEvent.TYPE,
                sourceEventId,
                userId,
                activityType,
                challengeId,
                challengeTitle,
                null,
                previous,
                next,
                delta,
                labelBefore,
                labelAfter,
                achievementCode,
                achievementTitle,
                streakWeeks,
                Instant.now());
        try {
            kafkaTemplate.send(topic, String.valueOf(userId), objectMapper.writeValueAsString(event));
        } catch (Exception e) {
            log.warn("Could not publish user activity {}: {}", sourceEventId, e.getMessage());
        }
    }
}
