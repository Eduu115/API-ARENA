package com.apiarena.socialservice.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

class SnapshotSanitizerTest {

    @Test
    void dropsPayloadsSpecsAndKeepsNamesOnly() {
        Map<String, Object> raw = new LinkedHashMap<>();
        raw.put("userId", 4);
        raw.put("submissionId", 9);
        raw.put("status", "COMPLETED");
        raw.put("totalScore", 820);
        raw.put("technicalScore", 700);
        raw.put("aiScore", 120);
        raw.put("zipFilePath", "/var/submissions/9.zip");
        raw.put("dockerfile", "FROM scratch");
        raw.put("requiredEndpoints", List.of("/secret"));
        raw.put("hints", "hidden spec");
        raw.put("requestBody", "{\"token\":\"x\"}");
        raw.put("responseBody", "payload");
        raw.put("buildLogs", "stack");
        raw.put("tests", List.of(Map.of(
                "name", "GET /health",
                "passed", true,
                "requestBody", "{\"a\":1}",
                "responseBody", "{\"b\":2}",
                "requestHeaders", Map.of("Authorization", "secret"),
                "actualResult", "should not leak")));
        raw.put("scores", List.of(
                Map.of("key", "TECHNICAL", "value", 700, "max", 800, "notes", "ignore"),
                Map.of("key", "HIDDEN_SPEC", "value", 1)));

        Map<String, Object> clean = SnapshotSanitizer.sanitize(raw);

        assertTrue(SnapshotSanitizer.TOP_LEVEL.containsAll(clean.keySet()));
        assertFalse(clean.containsKey("zipFilePath"));
        assertFalse(clean.containsKey("requestBody"));
        assertFalse(clean.containsKey("requiredEndpoints"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> tests = (List<Map<String, Object>>) clean.get("tests");
        assertEquals(List.of("name", "passed"), List.copyOf(tests.get(0).keySet()));
        assertEquals("GET /health", tests.get(0).get("name"));
        assertEquals(true, tests.get(0).get("passed"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> scores = (List<Map<String, Object>>) clean.get("scores");
        assertEquals(1, scores.size());
        assertEquals("TECHNICAL", scores.get(0).get("key"));
    }
}
