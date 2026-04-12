package com.apiarena.metricsservice.model.services;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MetricsAggregationService {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void ensureDocsFeedbackSchema() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS docs_feedback (
                    id BIGSERIAL PRIMARY KEY,
                    section_key VARCHAR(80) NOT NULL,
                    helpful BOOLEAN NOT NULL,
                    source_path VARCHAR(200) NOT NULL DEFAULT '/docs',
                    user_id BIGINT,
                    created_at TIMESTAMP NOT NULL DEFAULT NOW()
                )
                """);
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_docs_feedback_section ON docs_feedback(section_key)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_docs_feedback_created_at ON docs_feedback(created_at)");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS product_events (
                    id BIGSERIAL PRIMARY KEY,
                    event_name VARCHAR(120) NOT NULL,
                    event_type VARCHAR(64) NOT NULL DEFAULT 'PRODUCT',
                    source VARCHAR(80) NOT NULL DEFAULT 'frontend',
                    user_id BIGINT,
                    session_id VARCHAR(120),
                    properties_json TEXT,
                    occurred_at TIMESTAMP NOT NULL DEFAULT NOW()
                )
                """);
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_product_events_time ON product_events(occurred_at)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_product_events_name ON product_events(event_name)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_product_events_source ON product_events(source)");
    }

    public Map<String, Object> getOverview() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalSubmissions", queryLong("SELECT COUNT(*) FROM submissions"));
        out.put("completedSubmissions", queryLong("SELECT COUNT(*) FROM submissions WHERE status = 'COMPLETED'"));
        out.put("failedSubmissions", queryLong("SELECT COUNT(*) FROM submissions WHERE status = 'FAILED'"));
        out.put("avgTotalScore",
                queryDouble("SELECT COALESCE(AVG(total_score), 0) FROM submissions WHERE status = 'COMPLETED'"));
        out.put("p95BuildSeconds", queryDouble("""
                SELECT COALESCE(percentile_cont(0.95) WITHIN GROUP (
                    ORDER BY EXTRACT(EPOCH FROM (completed_at - created_at))
                ), 0)
                FROM submissions
                WHERE completed_at IS NOT NULL
                """));
        out.put("activeBuilds", queryLong("""
                SELECT COUNT(*) FROM sandbox_executions
                WHERE status IN ('BUILDING','RUNNING')
                """));
        return out;
    }

    public List<Map<String, Object>> getSubmissionDailySeries(int days) {
        return jdbcTemplate.queryForList("""
                SELECT date_trunc('day', created_at) AS bucket,
                       COUNT(*) AS submissions,
                       COUNT(*) FILTER (WHERE status='COMPLETED') AS completed,
                       COUNT(*) FILTER (WHERE status='FAILED') AS failed
                FROM submissions
                WHERE created_at >= now() - (? || ' days')::interval
                GROUP BY 1
                ORDER BY 1 ASC
                """, days);
    }

    public Map<String, Object> recordDocsFeedback(String sectionKey, boolean helpful, String sourcePath, Long userId) {
        if (sectionKey == null || sectionKey.isBlank()) {
            throw new IllegalArgumentException("sectionKey is required");
        }
        String normalizedSection = sectionKey.trim().toLowerCase();
        String normalizedPath = (sourcePath == null || sourcePath.isBlank()) ? "/docs" : sourcePath.trim();

        jdbcTemplate.update("""
                INSERT INTO docs_feedback (section_key, helpful, source_path, user_id)
                VALUES (?, ?, ?, ?)
                """,
                normalizedSection,
                helpful,
                normalizedPath,
                userId);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("sectionKey", normalizedSection);
        out.put("helpful", helpful);
        out.put("stored", true);
        return out;
    }

    public Map<String, Object> getDocsFeedbackSummary() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalFeedback", queryLong("SELECT COUNT(*) FROM docs_feedback"));
        out.put("helpfulCount", queryLong("SELECT COUNT(*) FROM docs_feedback WHERE helpful = true"));
        out.put("sections", jdbcTemplate.queryForList("""
                SELECT section_key AS "sectionKey",
                       COUNT(*) AS "totalVotes",
                       COUNT(*) FILTER (WHERE helpful = true) AS "helpfulVotes"
                FROM docs_feedback
                GROUP BY section_key
                ORDER BY "totalVotes" DESC, section_key ASC
                """));
        return out;
    }

    public Map<String, Object> recordProductEvent(
            String eventName,
            String eventType,
            String source,
            Long userId,
            String sessionId,
            String propertiesJson,
            String occurredAtIso) {
        if (eventName == null || eventName.isBlank()) {
            throw new IllegalArgumentException("eventName is required");
        }
        String normalizedName = eventName.trim().toLowerCase();
        String normalizedType = (eventType == null || eventType.isBlank()) ? "PRODUCT" : eventType.trim().toUpperCase();
        String normalizedSource = (source == null || source.isBlank()) ? "frontend" : source.trim().toLowerCase();
        LocalDateTime occurredAt = parseDateTimeOrNow(occurredAtIso);

        jdbcTemplate.update("""
                INSERT INTO product_events (event_name, event_type, source, user_id, session_id, properties_json, occurred_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                normalizedName,
                normalizedType,
                normalizedSource,
                userId,
                sessionId,
                propertiesJson,
                Timestamp.valueOf(occurredAt));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("stored", true);
        out.put("eventName", normalizedName);
        out.put("eventType", normalizedType);
        out.put("source", normalizedSource);
        out.put("occurredAt", occurredAt.toString());
        return out;
    }

    public Map<String, Object> getBiSummary(int days) {
        int safeDays = Math.max(1, Math.min(180, days));
        Map<String, Object> out = new LinkedHashMap<>();

        out.put("windowDays", safeDays);
        out.put("eventsInWindow", queryLong("""
                SELECT COUNT(*)
                FROM product_events
                WHERE occurred_at >= now() - (? || ' days')::interval
                """, safeDays));
        out.put("activeUsersInEventsWindow", queryLong("""
                SELECT COUNT(DISTINCT user_id)
                FROM product_events
                WHERE user_id IS NOT NULL
                  AND occurred_at >= now() - (? || ' days')::interval
                """, safeDays));
        out.put("docsFeedbackInWindow", queryLong("""
                SELECT COUNT(*)
                FROM docs_feedback
                WHERE created_at >= now() - (? || ' days')::interval
                """, safeDays));
        out.put("submissionsInWindow", queryLong("""
                SELECT COUNT(*)
                FROM submissions
                WHERE created_at >= now() - (? || ' days')::interval
                """, safeDays));
        out.put("topEvents", jdbcTemplate.queryForList("""
                SELECT event_name AS "eventName",
                       source,
                       COUNT(*) AS "total"
                FROM product_events
                WHERE occurred_at >= now() - (? || ' days')::interval
                GROUP BY event_name, source
                ORDER BY "total" DESC
                LIMIT 25
                """, safeDays));

        return out;
    }

    public List<Map<String, Object>> getBiDataset(
            String dataset,
            String fromIso,
            String toIso,
            int limit) {
        String normalizedDataset = dataset == null || dataset.isBlank() ? "events" : dataset.trim().toLowerCase();
        int safeLimit = Math.max(1, Math.min(50000, limit));
        LocalDateTime from = parseDateTimeOrFallback(fromIso, LocalDateTime.now().minusDays(30));
        LocalDateTime to = parseDateTimeOrFallback(toIso, LocalDateTime.now());
        if (to.isBefore(from)) {
            LocalDateTime tmp = from;
            from = to;
            to = tmp;
        }
        Timestamp fromTs = Timestamp.valueOf(from);
        Timestamp toTs = Timestamp.valueOf(to);

        if ("events".equals(normalizedDataset)) {
            return jdbcTemplate.queryForList("""
                    SELECT id,
                           event_name AS "eventName",
                           event_type AS "eventType",
                           source,
                           user_id AS "userId",
                           session_id AS "sessionId",
                           properties_json AS "propertiesJson",
                           occurred_at AS "occurredAt"
                    FROM product_events
                    WHERE occurred_at BETWEEN ? AND ?
                    ORDER BY occurred_at DESC
                    LIMIT ?
                    """, fromTs, toTs, safeLimit);
        }

        if ("submissions".equals(normalizedDataset)) {
            return jdbcTemplate.queryForList("""
                    SELECT id,
                           challenge_id AS "challengeId",
                           user_id AS "userId",
                           status,
                           total_score AS "totalScore",
                           correctness_score AS "correctnessScore",
                           performance_score AS "performanceScore",
                           design_score AS "designScore",
                           ai_review_score AS "aiReviewScore",
                           xp_earned AS "xpEarned",
                           elo_change AS "eloChange",
                           created_at AS "createdAt",
                           completed_at AS "completedAt"
                    FROM submissions
                    WHERE created_at BETWEEN ? AND ?
                    ORDER BY created_at DESC
                    LIMIT ?
                    """, fromTs, toTs, safeLimit);
        }

        if ("docs_feedback".equals(normalizedDataset) || "docs-feedback".equals(normalizedDataset)) {
            return jdbcTemplate.queryForList("""
                    SELECT id,
                           section_key AS "sectionKey",
                           helpful,
                           source_path AS "sourcePath",
                           user_id AS "userId",
                           created_at AS "createdAt"
                    FROM docs_feedback
                    WHERE created_at BETWEEN ? AND ?
                    ORDER BY created_at DESC
                    LIMIT ?
                    """, fromTs, toTs, safeLimit);
        }

        throw new IllegalArgumentException("Unsupported dataset: " + normalizedDataset);
    }

    public String exportBiDatasetCsv(
            String dataset,
            String fromIso,
            String toIso,
            int limit) {
        List<Map<String, Object>> rows = getBiDataset(dataset, fromIso, toIso, limit);
        if (rows.isEmpty()) {
            return "no_data\n";
        }
        List<String> headers = new ArrayList<>(rows.get(0).keySet());
        StringBuilder csv = new StringBuilder();
        csv.append(String.join(",", headers)).append('\n');

        for (Map<String, Object> row : rows) {
            StringJoiner joiner = new StringJoiner(",");
            for (String header : headers) {
                joiner.add(csvEscape(row.get(header)));
            }
            csv.append(joiner).append('\n');
        }
        return csv.toString();
    }

    private long queryLong(String sql) {
        Long val = jdbcTemplate.queryForObject(sql, Long.class);
        return val != null ? val : 0L;
    }

    private long queryLong(String sql, Object... args) {
        Long val = jdbcTemplate.queryForObject(sql, Long.class, args);
        return val != null ? val : 0L;
    }

    private double queryDouble(String sql) {
        Double val = jdbcTemplate.queryForObject(sql, Double.class);
        return val != null ? val : 0.0;
    }

    private LocalDateTime parseDateTimeOrNow(String isoValue) {
        return parseDateTimeOrFallback(isoValue, LocalDateTime.now());
    }

    private LocalDateTime parseDateTimeOrFallback(String isoValue, LocalDateTime fallback) {
        if (isoValue == null || isoValue.isBlank()) {
            return fallback;
        }
        String raw = isoValue.trim();
        try {
            return LocalDateTime.parse(raw);
        } catch (DateTimeParseException ignored) {
            try {
                Instant instant = Instant.parse(raw);
                return LocalDateTime.ofInstant(instant, ZoneOffset.UTC);
            } catch (DateTimeParseException ignoredAgain) {
                return fallback;
            }
        }
    }

    private String csvEscape(Object value) {
        if (value == null) {
            return "";
        }
        String text = String.valueOf(value);
        String escaped = text.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}
