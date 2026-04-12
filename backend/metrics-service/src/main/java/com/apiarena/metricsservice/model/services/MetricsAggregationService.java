package com.apiarena.metricsservice.model.services;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    private long queryLong(String sql) {
        Long val = jdbcTemplate.queryForObject(sql, Long.class);
        return val != null ? val : 0L;
    }

    private double queryDouble(String sql) {
        Double val = jdbcTemplate.queryForObject(sql, Double.class);
        return val != null ? val : 0.0;
    }
}
