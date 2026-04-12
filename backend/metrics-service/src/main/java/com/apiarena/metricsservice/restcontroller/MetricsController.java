package com.apiarena.metricsservice.restcontroller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.metricsservice.model.services.MetricsAggregationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/metrics")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" })
@RequiredArgsConstructor
public class MetricsController {

    private final MetricsAggregationService metricsAggregationService;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview() {
        return ResponseEntity.ok(metricsAggregationService.getOverview());
    }

    @GetMapping("/submissions/daily")
    public ResponseEntity<List<Map<String, Object>>> getDailySeries(
            @RequestParam(defaultValue = "14") int days) {
        return ResponseEntity.ok(metricsAggregationService.getSubmissionDailySeries(Math.max(1, Math.min(60, days))));
    }

    @PostMapping("/docs-feedback")
    public ResponseEntity<Map<String, Object>> submitDocsFeedback(@RequestBody Map<String, Object> payload) {
        String sectionKey = payload.get("sectionKey") != null ? String.valueOf(payload.get("sectionKey")) : null;
        boolean helpful = Boolean.parseBoolean(String.valueOf(payload.getOrDefault("helpful", false)));
        String sourcePath = payload.get("sourcePath") != null ? String.valueOf(payload.get("sourcePath")) : "/docs";
        Long userId = null;
        Object rawUserId = payload.get("userId");
        if (rawUserId instanceof Number n) {
            userId = n.longValue();
        } else if (rawUserId instanceof String s) {
            try {
                userId = Long.parseLong(s);
            } catch (NumberFormatException ignored) {
                userId = null;
            }
        }
        return ResponseEntity.ok(metricsAggregationService.recordDocsFeedback(sectionKey, helpful, sourcePath, userId));
    }

    @GetMapping("/docs-feedback/summary")
    public ResponseEntity<Map<String, Object>> getDocsFeedbackSummary() {
        return ResponseEntity.ok(metricsAggregationService.getDocsFeedbackSummary());
    }
}
