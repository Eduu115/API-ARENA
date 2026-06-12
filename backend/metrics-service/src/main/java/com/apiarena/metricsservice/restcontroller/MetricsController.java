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
import com.apiarena.metricsservice.security.LocalIpRateLimiter;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/metrics")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" })
@RequiredArgsConstructor
public class MetricsController {

    private final MetricsAggregationService metricsAggregationService;
    private final MetricsAccessService metricsAccessService;
    private final LocalIpRateLimiter localIpRateLimiter;

    @Value("${services.internal-token:}")
    private String internalToken;

    @Value("${apiarena.rate-limit.docs-feedback-per-ip-per-minute:10}")
    private int docsFeedbackPerIpPerMinute;

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
    public ResponseEntity<Map<String, Object>> submitDocsFeedback(
            @RequestBody Map<String, Object> payload,
            HttpServletRequest request) {
        enforceDocsFeedbackRateLimit(request);
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
    public ResponseEntity<Map<String, Object>> submitProductEvent(
            @RequestHeader(value = "X-Internal-Token", required = false) String internal,
            @RequestBody Map<String, Object> payload) {
        requireInternal(internal);
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

    /**
     * Product-event ingestion is server-to-server only. Without a configured token the
     * endpoint stays closed (fail-safe) to avoid open data injection.
     */
    private void requireInternal(String token) {
        if (internalToken == null || internalToken.isBlank() || !internalToken.equals(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid internal token");
        }
    }

    private void enforceDocsFeedbackRateLimit(HttpServletRequest request) {
        String ip = clientIp(request);
        String bucket = "docs-feedback:" + ip;
        if (!localIpRateLimiter.tryConsume(bucket, docsFeedbackPerIpPerMinute)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many feedback submissions. Please try again later.");
        }
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }
}
