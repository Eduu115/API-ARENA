package com.apiarena.notificationservice.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.apiarena.notificationservice.model.services.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class SubmissionCompletedConsumer {

    private static final Logger log = LoggerFactory.getLogger(SubmissionCompletedConsumer.class);

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public SubmissionCompletedConsumer(NotificationService notificationService, ObjectMapper objectMapper) {
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(
            topics = "${apiarena.kafka.topic.submission-completed:apiarena.submissions.completed}",
            groupId = "${spring.kafka.consumer.group-id:notification-service}"
    )
    public void onSubmissionCompleted(String payload) {
        try {
            SubmissionCompletedEvent event = objectMapper.readValue(payload, SubmissionCompletedEvent.class);
            if (event.eventType() == null || !SubmissionCompletedEvent.TYPE.equals(event.eventType())) {
                log.debug("Ignoring Kafka message with eventType={}", event.eventType());
                return;
            }
            if (event.challengeId() == null || event.userId() == null || event.submissionId() == null
                    || event.score() == null) {
                log.warn("Incomplete submission completed event, skip: {}", payload);
                return;
            }
            notificationService.createFromSubmissionCompleted(event);
            log.debug("Notification created for submission {}", event.submissionId());
        } catch (Exception e) {
            log.error("Failed to process submission completed Kafka message: {}", e.getMessage(), e);
        }
    }
}
