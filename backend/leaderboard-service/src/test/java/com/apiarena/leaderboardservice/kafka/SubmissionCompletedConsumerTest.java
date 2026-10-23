package com.apiarena.leaderboardservice.kafka;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.apiarena.leaderboardservice.model.dto.SubmitScoreRequest;
import com.apiarena.leaderboardservice.model.services.LeaderboardService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class SubmissionCompletedConsumerTest {

    private static final String EVENT = """
            {"eventType":"SUBMISSION_COMPLETED","submissionId":9,"userId":1,"challengeId":2,"username":"edu","score":800}
            """;

    @Mock
    LeaderboardService leaderboardService;

    SubmissionCompletedConsumer consumer;

    @BeforeEach
    void setUp() {
        consumer = new SubmissionCompletedConsumer(leaderboardService, new ObjectMapper());
    }

    @Test
    void validEventUpdatesLeaderboard() throws Exception {
        consumer.onSubmissionCompleted(EVENT);

        verify(leaderboardService).submitScore(any(SubmitScoreRequest.class));
    }

    @Test
    void malformedPayloadThrowsSoItIsDeadLettered() {
        assertThrows(JsonProcessingException.class, () -> consumer.onSubmissionCompleted("{not json"));

        verifyNoInteractions(leaderboardService);
    }

    @Test
    void serviceFailurePropagatesSoItIsRetried() {
        when(leaderboardService.submitScore(any())).thenThrow(new IllegalStateException("database down"));

        assertThrows(IllegalStateException.class, () -> consumer.onSubmissionCompleted(EVENT));
    }
}
