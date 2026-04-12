package com.apiarena.metricsservice.model.services;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MetricsAggregationService {

    private final JdbcTemplate jdbcTemplate;

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

    private long queryLong(String sql) {
        Long val = jdbcTemplate.queryForObject(sql, Long.class);
        return val != null ? val : 0L;
    }

    private double queryDouble(String sql) {
        Double val = jdbcTemplate.queryForObject(sql, Double.class);
        return val != null ? val : 0.0;
    }
}
