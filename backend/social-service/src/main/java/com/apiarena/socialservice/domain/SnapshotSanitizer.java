package com.apiarena.socialservice.domain;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Allow-list for a publish snapshot. Drops ZIP paths, source, request/response payloads,
 * logs, and challenge specs even if an upstream map contains them.
 */
public final class SnapshotSanitizer {

    public static final Set<String> TOP_LEVEL = Set.of(
            "userId", "submissionId", "challengeId", "challengeTitle", "status",
            "totalScore", "technicalScore", "aiScore",
            "testsPassed", "testsFailed",
            "avgResponseMs", "p95ResponseMs", "p99ResponseMs", "rps",
            "tests", "scores");

    private static final Set<String> SCORE_KEYS = Set.of(
            "TECHNICAL", "AI", "CORRECTNESS", "PERFORMANCE", "DESIGN");

    private SnapshotSanitizer() {
    }

    public static Map<String, Object> sanitize(Map<String, Object> raw) {
        Map<String, Object> in = raw == null ? Map.of() : raw;
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("userId", asLong(in.get("userId")));
        out.put("submissionId", asLong(in.get("submissionId")));
        out.put("challengeId", asLong(in.get("challengeId")));
        out.put("challengeTitle", clip(asString(in.get("challengeTitle")), 200));
        out.put("status", clip(asString(in.get("status")), 40));
        out.put("totalScore", asInt(in.get("totalScore")));
        out.put("technicalScore", asInt(in.get("technicalScore")));
        out.put("aiScore", asInt(in.get("aiScore")));
        out.put("avgResponseMs", asInt(in.get("avgResponseMs")));
        out.put("p95ResponseMs", asInt(in.get("p95ResponseMs")));
        out.put("p99ResponseMs", asInt(in.get("p99ResponseMs")));
        out.put("rps", asInt(in.get("rps")));
        List<Map<String, Object>> tests = tests(in.get("tests"));
        out.put("tests", tests);
        out.put("scores", scores(in.get("scores")));
        int passed = 0;
        int failed = 0;
        for (Map<String, Object> t : tests) {
            if (Boolean.TRUE.equals(t.get("passed"))) {
                passed++;
            } else {
                failed++;
            }
        }
        out.put("testsPassed", passed);
        out.put("testsFailed", failed);
        return out;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> tests(Object raw) {
        List<Map<String, Object>> out = new ArrayList<>();
        if (!(raw instanceof List<?> list)) {
            return out;
        }
        for (Object item : list) {
            if (!(item instanceof Map<?, ?> map)) {
                continue;
            }
            String name = clip(asString(map.get("name")), 200);
            if (name == null || name.isBlank()) {
                name = clip(asString(map.get("testName")), 200);
            }
            if (name == null || name.isBlank()) {
                continue;
            }
            boolean passed = isPassed(map.get("passed"), map.get("status"));
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", name);
            row.put("passed", passed);
            out.add(row);
        }
        return out;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> scores(Object raw) {
        List<Map<String, Object>> out = new ArrayList<>();
        if (!(raw instanceof List<?> list)) {
            return out;
        }
        for (Object item : list) {
            if (!(item instanceof Map<?, ?> map)) {
                continue;
            }
            String key = asString(map.get("key"));
            if (key == null) {
                key = asString(map.get("scoreKey"));
            }
            if (key == null) {
                continue;
            }
            String norm = key.trim().toUpperCase();
            if (!SCORE_KEYS.contains(norm)) {
                continue;
            }
            Integer value = asInt(map.get("value") != null ? map.get("value") : map.get("scoreValue"));
            if (value == null) {
                continue;
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("key", norm);
            row.put("value", value);
            row.put("max", asInt(map.get("max") != null ? map.get("max") : map.get("maxValue")));
            out.add(row);
        }
        return out;
    }

    private static boolean isPassed(Object passed, Object status) {
        if (passed instanceof Boolean b) {
            return b;
        }
        String st = asString(status);
        return st != null && "PASSED".equalsIgnoreCase(st.trim());
    }

    private static String asString(Object v) {
        return v == null ? null : String.valueOf(v);
    }

    private static String clip(String v, int max) {
        if (v == null) {
            return null;
        }
        String t = v.trim();
        if (t.isEmpty()) {
            return null;
        }
        return t.length() <= max ? t : t.substring(0, max);
    }

    private static Long asLong(Object v) {
        if (v instanceof Number n) {
            return n.longValue();
        }
        if (v instanceof String s) {
            try {
                return Long.parseLong(s.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private static Integer asInt(Object v) {
        if (v instanceof Number n) {
            return n.intValue();
        }
        if (v instanceof String s) {
            try {
                return (int) Math.round(Double.parseDouble(s.trim()));
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }
}
