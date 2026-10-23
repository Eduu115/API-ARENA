package com.apiarena.leaderboardservice.kafka;

import org.apache.kafka.common.TopicPartition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaOperations;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.ExponentialBackOffWithMaxRetries;
import org.springframework.util.backoff.BackOff;

import com.fasterxml.jackson.core.JsonProcessingException;

/**
 * Failed listener records are retried with exponential backoff and, once retries run out, published to
 * {@code <topic>.<group>.DLT} instead of being dropped. Consumers are idempotent, so redelivery is safe.
 * Spring Boot wires this bean into the default listener container factory.
 */
@Configuration
public class KafkaErrorHandlingConfig {

    @Bean
    DefaultErrorHandler kafkaErrorHandler(
            KafkaOperations<?, ?> kafkaTemplate,
            @Value("${spring.kafka.consumer.group-id}") String groupId) {
        // 1s, 2s, 4s, 8s: rides out a short DB or broker blip (~15s) before giving up.
        ExponentialBackOffWithMaxRetries backOff = new ExponentialBackOffWithMaxRetries(4);
        backOff.setInitialInterval(1_000);
        backOff.setMultiplier(2);
        return errorHandler(kafkaTemplate, groupId, backOff);
    }

    static DefaultErrorHandler errorHandler(KafkaOperations<?, ?> kafkaTemplate, String groupId, BackOff backOff) {
        // Partition -1 lets the producer choose, so the DLT needs no partition parity with the source topic.
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(kafkaTemplate,
                (record, ex) -> new TopicPartition(record.topic() + "." + groupId + ".DLT", -1));
        DefaultErrorHandler handler = new DefaultErrorHandler(recoverer, backOff);
        // A payload that cannot be parsed will never succeed: dead-letter it straight away.
        handler.addNotRetryableExceptions(JsonProcessingException.class);
        return handler;
    }
}
