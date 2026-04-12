package com.apiarena.metricsservice.restcontroller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.apiarena.metricsservice.model.services.MetricsAggregationService;
import com.apiarena.metricsservice.model.services.MetricsAccessService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/metrics")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" })
@RequiredArgsConstructor
public class MetricsController {

    private final MetricsAggregationService metricsAggregationService;
    private final MetricsAccessService metricsAccessService;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        requireAdmin(authorizationHeader);
        return ResponseEntity.ok(metricsAggregationService.getOverview());
    }

    @GetMapping("/submissions/daily")
    public ResponseEntity<List<Map<String, Object>>> getDailySeries(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestParam(defaultValue = "14") int days) {
        requireAdmin(authorizationHeader);
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

    @PostMapping("/events")
    public ResponseEntity<Map<String, Object>> submitProductEvent(@RequestBody Map<String, Object> payload) {
        String eventName = payload.get("eventName") != null ? String.valueOf(payload.get("eventName")) : null;
        String eventType = payload.get("eventType") != null ? String.valueOf(payload.get("eventType")) : "PRODUCT";
        String source = payload.get("source") != null ? String.valueOf(payload.get("source")) : "frontend";
        String sessionId = payload.get("sessionId") != null ? String.valueOf(payload.get("sessionId")) : null;
        String propertiesJson = payload.get("propertiesJson") != null ? String.valueOf(payload.get("propertiesJson")) : null;
        String occurredAt = payload.get("occurredAt") != null ? String.valueOf(payload.get("occurredAt")) : null;
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
        return ResponseEntity.ok(
                metricsAggregationService.recordProductEvent(
                        eventName,
                        eventType,
                        source,
                        userId,
                        sessionId,
                        propertiesJson,
                        occurredAt));
    }

    @GetMapping("/docs-feedback/summary")
    public ResponseEntity<Map<String, Object>> getDocsFeedbackSummary(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        requireAdmin(authorizationHeader);
        return ResponseEntity.ok(metricsAggregationService.getDocsFeedbackSummary());
    }

    @GetMapping("/bi/summary")
    public ResponseEntity<Map<String, Object>> getBiSummary(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestParam(defaultValue = "30") int days) {
        requireAdmin(authorizationHeader);
        return ResponseEntity.ok(metricsAggregationService.getBiSummary(Math.max(1, Math.min(180, days))));
    }

    @GetMapping("/bi/export")
    public ResponseEntity<?> exportBiDataset(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestParam(defaultValue = "events") String dataset,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "5000") int limit,
            @RequestParam(defaultValue = "json") String format) {
        requireAdmin(authorizationHeader);
        String normalizedFormat = format == null ? "json" : format.trim().toLowerCase();
        int safeLimit = Math.max(1, Math.min(50000, limit));

        if ("csv".equals(normalizedFormat)) {
            String csv = metricsAggregationService.exportBiDatasetCsv(dataset, from, to, safeLimit);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"apiarena-" + dataset.replaceAll("[^a-zA-Z0-9_-]", "") + "-export.csv\"")
                    .contentType(new MediaType("text", "csv"))
                    .body(csv);
        }

        return ResponseEntity.ok(metricsAggregationService.getBiDataset(dataset, from, to, safeLimit));
    }

    private void requireAdmin(String authorizationHeader) {
        if (!metricsAccessService.isAdminAuthorized(authorizationHeader)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }
}
