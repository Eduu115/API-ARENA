package com.apiarena.socialservice.kafka;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.apiarena.socialservice.service.SocialIngestService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class SocialActivityConsumerTest {

    private static final String SUBMISSION = """
            {"eventType":"SUBMISSION_COMPLETED","submissionId":9,"userId":1,"challengeId":2,"score":800}
            """;
    private static final String ACTIVITY = """
            {"eventType":"USER_ACTIVITY","sourceEventId":"leaderboard:rank:1:submission:9","userId":1,"activityType":"RANK_CLIMB"}
            """;

    @Mock
    SocialIngestService ingestService;

    private SocialActivityConsumer consumer(boolean enabled) {
        return new SocialActivityConsumer(ingestService, new ObjectMapper(), enabled);
    }

    @Test
    void disabledIgnoresEverythingWithoutParsing() throws Exception {
        consumer(false).onSubmissionCompleted("{not json");
        consumer(false).onUserActivity("{not json");

        verifyNoInteractions(ingestService);
    }

    @Test
    void validEventsAreIngested() throws Exception {
        consumer(true).onSubmissionCompleted(SUBMISSION);
        consumer(true).onUserActivity(ACTIVITY);

        verify(ingestService).fromSubmission(any(SubmissionCompletedEvent.class));
        verify(ingestService).fromUserActivity(any(UserActivityEvent.class));
    }

    @Test
    void malformedPayloadThrowsSoItIsDeadLettered() {
        assertThrows(JsonProcessingException.class, () -> consumer(true).onSubmissionCompleted("{not json"));
        assertThrows(JsonProcessingException.class, () -> consumer(true).onUserActivity("{not json"));

        verifyNoInteractions(ingestService);
    }

    @Test
    void ingestFailurePropagatesSoItIsRetried() {
        doThrow(new IllegalStateException("database down")).when(ingestService).fromSubmission(any());

        assertThrows(IllegalStateException.class, () -> consumer(true).onSubmissionCompleted(SUBMISSION));
    }
}
