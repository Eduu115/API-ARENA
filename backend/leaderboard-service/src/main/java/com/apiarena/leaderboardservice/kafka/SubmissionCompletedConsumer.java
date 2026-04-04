package com.apiarena.leaderboardservice.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.apiarena.leaderboardservice.model.dto.SubmitScoreRequest;
import com.apiarena.leaderboardservice.model.services.LeaderboardService;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class SubmissionCompletedConsumer {

    private static final Logger log = LoggerFactory.getLogger(SubmissionCompletedConsumer.class);

    private final LeaderboardService leaderboardService;
    private final ObjectMapper objectMapper;

    public SubmissionCompletedConsumer(LeaderboardService leaderboardService, ObjectMapper objectMapper) {
        this.leaderboardService = leaderboardService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(
            topics = "${apiarena.kafka.topic.submission-completed:apiarena.submissions.completed}",
            groupId = "${spring.kafka.consumer.group-id:leaderboard-service}"
    )
    public void onSubmissionCompleted(String payload) {
        try {
            SubmissionCompletedEvent event = objectMapper.readValue(payload, SubmissionCompletedEvent.class);
            if (event.eventType() == null || !SubmissionCompletedEvent.TYPE.equals(event.eventType())) {
                log.debug("Ignoring Kafka message with eventType={}", event.eventType());
                return;
            }
            if (event.challengeId() == null || event.userId() == null || event.submissionId() == null
                    || event.username() == null || event.score() == null) {
                log.warn("Incomplete submission completed event, skip: {}", payload);
                return;
            }
            SubmitScoreRequest req = new SubmitScoreRequest(
                    event.challengeId(),
                    event.userId(),
                    event.submissionId(),
                    event.username(),
                    event.score(),
                    event.completionTimeSeconds());
            leaderboardService.submitScore(req);
            log.debug("Leaderboard updated from submission {}", event.submissionId());
        } catch (Exception e) {
            log.error("Failed to process submission completed Kafka message: {}", e.getMessage(), e);
        }
    }
}
