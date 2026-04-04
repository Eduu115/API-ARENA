package com.apiarena.submissionservice.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class SubmissionKafkaPublisher {

    private static final Logger log = LoggerFactory.getLogger(SubmissionKafkaPublisher.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final String topic;

    public SubmissionKafkaPublisher(
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper,
            @Value("${apiarena.kafka.topic.submission-completed:apiarena.submissions.completed}") String topic
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.topic = topic;
    }

    public void publishSubmissionCompleted(SubmissionCompletedEvent event) {
        try {
            String json = objectMapper.writeValueAsString(event);
            String key = event.submissionId() != null ? String.valueOf(event.submissionId()) : event.userId().toString();
            kafkaTemplate.send(topic, key, json)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Kafka publish failed for topic {} key {}: {}", topic, key, ex.getMessage());
                        } else {
                            log.debug("Published to {} partition {} offset {}",
                                    topic,
                                    result.getRecordMetadata().partition(),
                                    result.getRecordMetadata().offset());
                        }
                    });
        } catch (JsonProcessingException e) {
            log.error("Could not serialize SubmissionCompletedEvent: {}", e.getMessage());
        }
    }
}
