package com.apiarena.leaderboardservice.kafka;

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
    private final int rankClimbThreshold;
    private final String topic;

    public UserActivityPublisher(
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper,
            @Value("${app.social.enabled:false}") boolean enabled,
            @Value("${app.social.rank-climb-threshold:5}") int rankClimbThreshold,
            @Value("${apiarena.kafka.topic.user-activity:apiarena.user.activity}") String topic) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.rankClimbThreshold = rankClimbThreshold;
        this.topic = topic;
    }

    public void rankClimb(Long userId, Long submissionId, Integer beforeRank, Integer afterRank) {
        if (!enabled || userId == null || submissionId == null || beforeRank == null || afterRank == null) {
            return;
        }
        int climb = beforeRank - afterRank;
        if (climb < rankClimbThreshold) {
            return;
        }
        String source = "leaderboard:rank:" + userId + ":submission:" + submissionId;
        try {
            String json = objectMapper.writeValueAsString(java.util.Map.of(
                    "eventType", "USER_ACTIVITY",
                    "sourceEventId", source,
                    "userId", userId,
                    "activityType", "RANK_CLIMB",
                    "previousValue", beforeRank,
                    "newValue", afterRank,
                    "delta", climb,
                    "occurredAt", Instant.now().toString()));
            kafkaTemplate.send(topic, String.valueOf(userId), json);
        } catch (Exception e) {
            log.warn("Could not publish rank climb {}: {}", source, e.getMessage());
        }
    }
}
