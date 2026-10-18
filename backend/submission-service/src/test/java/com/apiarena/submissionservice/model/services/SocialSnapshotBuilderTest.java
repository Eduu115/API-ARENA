package com.apiarena.submissionservice.model.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.apiarena.submissionservice.model.entities.Submission;

class SocialSnapshotBuilderTest {

    @Test
    void snapshotHasScoresAndTestNamesWithoutPayloads() {
        Submission submission = new Submission();
        submission.setId(9L);
        submission.setUserId(4L);
        submission.setChallengeId(2L);
        submission.setStatus(Submission.Status.COMPLETED);
        submission.setZipFilePath("/tmp/secret.zip");
        submission.setBuildLogs("should stay off the map");

        var snap = SocialSnapshotBuilder.build(submission, "Payments", List.of(
                new SocialSnapshotBuilder.NamedTest("GET /health", true),
                new SocialSnapshotBuilder.NamedTest("POST /pay", false)));

        assertEquals(4L, snap.get("userId"));
        assertEquals("COMPLETED", snap.get("status"));
        assertFalse(snap.containsKey("zipFilePath"));
        assertFalse(snap.containsKey("buildLogs"));
        assertFalse(snap.containsKey("requestBody"));
        @SuppressWarnings("unchecked")
        var tests = (List<java.util.Map<String, Object>>) snap.get("tests");
        assertEquals(List.of("name", "passed"), List.copyOf(tests.get(0).keySet()));
        assertEquals("GET /health", tests.get(0).get("name"));
    }
}
