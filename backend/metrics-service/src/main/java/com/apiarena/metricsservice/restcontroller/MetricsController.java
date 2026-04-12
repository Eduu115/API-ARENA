package com.apiarena.metricsservice.restcontroller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.metricsservice.model.services.MetricsAggregationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/metrics")
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
}
