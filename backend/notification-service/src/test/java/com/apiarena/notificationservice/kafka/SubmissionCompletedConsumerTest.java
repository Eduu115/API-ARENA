package com.apiarena.notificationservice.kafka;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.apiarena.notificationservice.model.services.NotificationService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class SubmissionCompletedConsumerTest {

    private static final String EVENT = """
            {"eventType":"SUBMISSION_COMPLETED","submissionId":9,"userId":1,"challengeId":2,"score":800}
            """;

    @Mock
    NotificationService notificationService;

    SubmissionCompletedConsumer consumer;

    @BeforeEach
    void setUp() {
        consumer = new SubmissionCompletedConsumer(notificationService, new ObjectMapper());
    }

    @Test
    void validEventCreatesNotification() throws Exception {
        consumer.onSubmissionCompleted(EVENT);

        verify(notificationService).createFromSubmissionCompleted(any(SubmissionCompletedEvent.class));
    }

    @Test
    void malformedPayloadThrowsSoItIsDeadLettered() {
        assertThrows(JsonProcessingException.class, () -> consumer.onSubmissionCompleted("{not json"));

        verifyNoInteractions(notificationService);
    }

    @Test
    void serviceFailurePropagatesSoItIsRetried() {
        doThrow(new IllegalStateException("database down")).when(notificationService).createFromSubmissionCompleted(any());

        assertThrows(IllegalStateException.class, () -> consumer.onSubmissionCompleted(EVENT));
    }
}
