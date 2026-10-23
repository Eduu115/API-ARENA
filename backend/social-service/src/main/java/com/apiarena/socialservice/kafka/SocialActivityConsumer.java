package com.apiarena.socialservice.kafka;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.apiarena.socialservice.service.SocialIngestService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * No catch-all in the listeners: failures reach {@link KafkaErrorHandlingConfig} (retry with backoff, then DLT).
 */
@Component
public class SocialActivityConsumer {

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
    public void onSubmissionCompleted(String payload) throws JsonProcessingException {
        if (!enabled) {
            return;
        }
        SubmissionCompletedEvent event = objectMapper.readValue(payload, SubmissionCompletedEvent.class);
        if (!SubmissionCompletedEvent.TYPE.equals(event.eventType())) {
            return;
        }
        ingestService.fromSubmission(event);
    }

    @KafkaListener(
            topics = "${apiarena.kafka.topic.user-activity:apiarena.user.activity}",
            groupId = "${spring.kafka.consumer.group-id:social-service}")
    public void onUserActivity(String payload) throws JsonProcessingException {
        if (!enabled) {
            return;
        }
        UserActivityEvent event = objectMapper.readValue(payload, UserActivityEvent.class);
        if (event.eventType() != null && !UserActivityEvent.TYPE.equals(event.eventType())) {
            return;
        }
        ingestService.fromUserActivity(event);
    }
}
