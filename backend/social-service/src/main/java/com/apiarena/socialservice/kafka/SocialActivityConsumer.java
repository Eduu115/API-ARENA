package com.apiarena.socialservice.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.apiarena.socialservice.service.SocialIngestService;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class SocialActivityConsumer {

    private static final Logger log = LoggerFactory.getLogger(SocialActivityConsumer.class);

    private final SocialIngestService ingestService;
    private final ObjectMapper objectMapper;
    private final boolean enabled;

    public SocialActivityConsumer(
            SocialIngestService ingestService,
            ObjectMapper objectMapper,
            @Value("${app.social.enabled:false}") boolean enabled) {
        this.ingestService = ingestService;
        this.objectMapper = objectMapper;
        this.enabled = enabled;
    }

    @KafkaListener(
            topics = "${apiarena.kafka.topic.submission-completed:apiarena.submissions.completed}",
            groupId = "${spring.kafka.consumer.group-id:social-service}")
    public void onSubmissionCompleted(String payload) {
        if (!enabled) {
            return;
        }
        try {
            SubmissionCompletedEvent event = objectMapper.readValue(payload, SubmissionCompletedEvent.class);
            if (!SubmissionCompletedEvent.TYPE.equals(event.eventType())) {
                return;
            }
            ingestService.fromSubmission(event);
        } catch (Exception e) {
            log.error("Failed to ingest submission activity: {}", e.getMessage());
        }
    }

    @KafkaListener(
            topics = "${apiarena.kafka.topic.user-activity:apiarena.user.activity}",
            groupId = "${spring.kafka.consumer.group-id:social-service}")
    public void onUserActivity(String payload) {
        if (!enabled) {
            return;
        }
        try {
            UserActivityEvent event = objectMapper.readValue(payload, UserActivityEvent.class);
            if (event.eventType() != null && !UserActivityEvent.TYPE.equals(event.eventType())) {
                return;
            }
            ingestService.fromUserActivity(event);
        } catch (Exception e) {
            log.error("Failed to ingest user activity: {}", e.getMessage());
        }
    }
}
