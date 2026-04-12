package com.apiarena.aireviewservice.model.services;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.apiarena.aireviewservice.model.dto.AiReviewRequest;
import com.apiarena.aireviewservice.model.dto.AiReviewResponse;

@Service
public class AiReviewService {

    public AiReviewResponse review(AiReviewRequest request) {
        int score = 700;
        List<String> suggestions = new ArrayList<>();
        Map<String, Object> diagnostics = new LinkedHashMap<>();

        String buildLogs = safeLower(request.getBuildLogs());
        String testLogs = safeLower(request.getTestLogs());
        int endpointCount = request.getEndpoints() != null ? request.getEndpoints().size() : 0;

        if (buildLogs.contains("error")) {
            score -= 220;
            suggestions.add("Fix build-time errors before submission.");
        }
        if (testLogs.contains("failed") || testLogs.contains("error")) {
            score -= 180;
            suggestions.add("Address failing tests and unstable endpoints.");
        } else {
            score += 80;
        }
        if (endpointCount >= 3) {
            score += 60;
        } else {
            suggestions.add("Expand endpoint coverage and expose complete challenge contract.");
        }
        if (testLogs.contains("timeout")) {
            score -= 80;
            suggestions.add("Reduce response latency and timeout failures.");
        }
        if (!testLogs.contains("validation")) {
            suggestions.add("Add stricter input validation and clear error responses.");
        }

        score = Math.max(0, Math.min(1000, score));
        diagnostics.put("endpointCount", endpointCount);
        diagnostics.put("buildErrorDetected", buildLogs.contains("error"));
        diagnostics.put("testFailureDetected", testLogs.contains("failed") || testLogs.contains("error"));

        String summary;
        if (score >= 850) {
            summary = "Strong implementation quality with minor improvement opportunities.";
        } else if (score >= 650) {
            summary = "Acceptable implementation quality with clear areas to improve.";
        } else {
            summary = "Implementation needs significant improvements in correctness and reliability.";
        }

        return AiReviewResponse.builder()
                .score(score)
                .summary(summary)
                .suggestions(suggestions)
                .diagnostics(diagnostics)
                .build();
    }

    private String safeLower(String raw) {
        return raw != null ? raw.toLowerCase(Locale.ROOT) : "";
    }
}
