package com.apiarena.submissionservice.model.services;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.apiarena.submissionservice.model.entities.Submission;

/**
 * Allow-listed snapshot for a social post. Callers must pass test names and pass/fail only.
 */
public final class SocialSnapshotBuilder {

    public record NamedTest(String name, boolean passed) {
    }

    private SocialSnapshotBuilder() {
    }

    public static Map<String, Object> build(Submission submission, String challengeTitle, List<NamedTest> tests) {
        int correctness = intOf(submission.getCorrectnessScore());
        int performance = intOf(submission.getPerformanceScore());
        int design = intOf(submission.getDesignScore());
        int ai = intOf(submission.getAiReviewScore());
        int technical = correctness + performance + design;
        int total = submission.getTotalScore() == null ? technical + ai : submission.getTotalScore().intValue();

        List<Map<String, Object>> testRows = new ArrayList<>();
        if (tests != null) {
            for (NamedTest test : tests) {
                if (test == null || test.name() == null || test.name().isBlank()) {
                    continue;
                }
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("name", test.name().trim());
                row.put("passed", test.passed());
                testRows.add(row);
            }
        }
        List<Map<String, Object>> scores = List.of(
                score("TECHNICAL", technical, 800),
                score("AI", ai, 200),
                score("CORRECTNESS", correctness, 300),
                score("PERFORMANCE", performance, 300),
                score("DESIGN", design, 200));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("userId", submission.getUserId());
        out.put("submissionId", submission.getId());
        out.put("challengeId", submission.getChallengeId());
        out.put("challengeTitle", challengeTitle);
        out.put("status", submission.getStatus() == null ? null : submission.getStatus().name());
        out.put("totalScore", total);
        out.put("technicalScore", technical);
        out.put("aiScore", ai);
        out.put("avgResponseMs", submission.getAvgResponseMs());
        out.put("p95ResponseMs", submission.getP95ResponseMs());
        out.put("p99ResponseMs", submission.getP99ResponseMs());
        out.put("rps", submission.getRps());
        out.put("tests", testRows);
        out.put("scores", scores);
        return out;
    }

    private static Map<String, Object> score(String key, int value, int max) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("key", key);
        row.put("value", value);
        row.put("max", max);
        return row;
    }

    private static int intOf(BigDecimal value) {
        return value == null ? 0 : value.intValue();
    }
}
