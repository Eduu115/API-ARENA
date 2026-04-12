package com.apiarena.aireviewservice.model.services;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.apiarena.aireviewservice.model.dto.AiReviewRequest;
import com.apiarena.aireviewservice.model.dto.AiReviewResponse;

@Service
public class AiReviewService {

    private static final Logger log = LoggerFactory.getLogger(AiReviewService.class);

    @Value("${ai-review.provider:heuristic}")
    private String provider;

    @Value("${ai-review.model:gemini-2.0-flash}")
    private String model;

    @Value("${ai-review.google-api-key:}")
    private String googleApiKey;

    @Value("${ai-review.google-base-url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String googleBaseUrl;

    @Value("${ai-review.timeout-ms:12000}")
    private int timeoutMs;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiReviewResponse review(AiReviewRequest request) {
        if ("gemini".equalsIgnoreCase(provider) && googleApiKey != null && !googleApiKey.isBlank()) {
            try {
                return reviewWithGemini(request);
            } catch (Exception e) {
                log.warn("Gemini review failed, fallback to heuristic: {}", e.getMessage());
                AiReviewResponse fallback = reviewHeuristic(request);
                fallback.setDiagnostics(mergeDiagnostics(fallback.getDiagnostics(), Map.of(
                        "fallbackActivated", true,
                        "fallbackReason", e.getMessage() != null ? e.getMessage() : "unknown")));
                return fallback;
            }
        }
        return reviewHeuristic(request);
    }

    private AiReviewResponse reviewHeuristic(AiReviewRequest request) {
        int overallScore = 680;
        int performance = 70;
        int aesthetics = 62;
        int cleanliness = 68;
        int structure = 70;
        List<String> strengths = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();
        Map<String, Object> diagnostics = new LinkedHashMap<>();

        String buildLogs = safeLower(request.getBuildLogs());
        String testLogs = safeLower(request.getTestLogs());
        int endpointCount = request.getEndpoints() != null ? request.getEndpoints().size() : 0;

        if (buildLogs.contains("error")) {
            overallScore -= 220;
            structure -= 20;
            cleanliness -= 20;
            suggestions.add("Fix build-time errors before submission.");
        }
        if (testLogs.contains("failed") || testLogs.contains("error")) {
            overallScore -= 160;
            performance -= 10;
            structure -= 8;
            suggestions.add("Address failing tests and unstable endpoints.");
        } else {
            overallScore += 60;
            strengths.add("Execution logs show stable tests without failures.");
        }
        if (endpointCount >= 3) {
            overallScore += 40;
            structure += 6;
            strengths.add("Endpoint coverage is broad enough for challenge scope.");
        } else {
            suggestions.add("Expand endpoint coverage and expose complete challenge contract.");
        }
        if (testLogs.contains("timeout")) {
            overallScore -= 90;
            performance -= 20;
            suggestions.add("Reduce response latency and timeout failures.");
        }
        if (!testLogs.contains("validation")) {
            cleanliness -= 8;
            suggestions.add("Add stricter input validation and clear error responses.");
        } else {
            strengths.add("Validation behavior is visible in testing traces.");
        }

        overallScore = clamp(overallScore, 0, 1000);
        performance = clamp(performance, 0, 100);
        aesthetics = clamp(aesthetics, 0, 100);
        cleanliness = clamp(cleanliness, 0, 100);
        structure = clamp(structure, 0, 100);
        int aiScore = clamp((int) Math.round((overallScore / 1000.0) * 200.0), 0, 200);

        diagnostics.put("endpointCount", endpointCount);
        diagnostics.put("buildErrorDetected", buildLogs.contains("error"));
        diagnostics.put("testFailureDetected", testLogs.contains("failed") || testLogs.contains("error"));
        diagnostics.put("technicalScore", safeInt(request.getTechnicalScore()));
        diagnostics.put("providerConfigured", provider);

        String summary;
        if (overallScore >= 850) {
            summary = "Strong implementation quality with minor improvement opportunities.";
        } else if (overallScore >= 650) {
            summary = "Acceptable implementation quality with clear areas to improve.";
        } else {
            summary = "Implementation needs significant improvements in correctness and reliability.";
        }

        return AiReviewResponse.builder()
                .aiScore(aiScore)
                .score(aiScore)
                .overallScore(overallScore)
                .performanceScore(performance)
                .aestheticsScore(aesthetics)
                .cleanlinessScore(cleanliness)
                .structureScore(structure)
                .provider("heuristic")
                .summary(summary)
                .strengths(strengths)
                .suggestions(suggestions)
                .diagnostics(diagnostics)
                .build();
    }

    private AiReviewResponse reviewWithGemini(AiReviewRequest request) throws Exception {
        String prompt = buildPrompt(request);
        Map<String, Object> payload = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "temperature", 0.2,
                        "responseMimeType", "application/json"));
        String url = String.format("%s/%s:generateContent?key=%s", googleBaseUrl, model, googleApiKey);

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(timeoutMs))
                .build();
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofMillis(timeoutMs))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                .build();
        HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("Gemini returned HTTP " + response.statusCode());
        }

        Map<String, Object> raw = objectMapper.readValue(response.body(), new TypeReference<>() {});
        String text = extractGeminiText(raw);
        if (text == null || text.isBlank()) {
            throw new IllegalStateException("Gemini response did not include a parseable JSON block");
        }

        Map<String, Object> parsed = objectMapper.readValue(text, new TypeReference<>() {});
        int overall = clamp(safeInt(parsed.get("overallScore")), 0, 1000);
        int performance = clamp(safeInt(parsed.get("performanceScore")), 0, 100);
        int aesthetics = clamp(safeInt(parsed.get("aestheticsScore")), 0, 100);
        int cleanliness = clamp(safeInt(parsed.get("cleanlinessScore")), 0, 100);
        int structure = clamp(safeInt(parsed.get("structureScore")), 0, 100);
        int aiScore = clamp(safeInt(parsed.get("aiScore")), 0, 200);
        if (aiScore == 0 && overall > 0) {
            aiScore = clamp((int) Math.round((overall / 1000.0) * 200.0), 0, 200);
        }

        String summary = Objects.toString(parsed.get("summary"), "AI review completed.");
        List<String> strengths = toStringList(parsed.get("strengths"));
        List<String> suggestions = toStringList(parsed.get("suggestions"));
        Map<String, Object> diagnostics = new LinkedHashMap<>();
        diagnostics.put("providerModel", model);
        diagnostics.put("rawProvider", "gemini");

        return AiReviewResponse.builder()
                .aiScore(aiScore)
                .score(aiScore)
                .overallScore(overall)
                .performanceScore(performance)
                .aestheticsScore(aesthetics)
                .cleanlinessScore(cleanliness)
                .structureScore(structure)
                .provider("gemini")
                .summary(summary)
                .strengths(strengths)
                .suggestions(suggestions)
                .diagnostics(diagnostics)
                .build();
    }

    private String buildPrompt(AiReviewRequest request) {
        List<String> endpoints = request.getEndpoints() != null ? request.getEndpoints() : List.of();
        String buildLogs = trimForPrompt(request.getBuildLogs(), 1800);
        String testLogs = trimForPrompt(request.getTestLogs(), 2600);

        return """
                You are reviewing a backend coding challenge submission.
                Return ONLY valid JSON without markdown fences.

                Scoring rules:
                - overallScore: integer 0..1000
                - aiScore: integer 0..200 (this is the AI contribution to final grading)
                - performanceScore, aestheticsScore, cleanlinessScore, structureScore: integer 0..100

                Output schema:
                {
                  "overallScore": 0,
                  "aiScore": 0,
                  "performanceScore": 0,
                  "aestheticsScore": 0,
                  "cleanlinessScore": 0,
                  "structureScore": 0,
                  "summary": "short sentence",
                  "strengths": ["..."],
                  "suggestions": ["..."]
                }

                Input context:
                technicalScore=%d
                correctnessScore=%d
                performanceScore=%d
                designScore=%d
                endpoints=%s
                buildLogs=
                %s

                testLogs=
                %s
                """.formatted(
                safeInt(request.getTechnicalScore()),
                safeInt(request.getCorrectnessScore()),
                safeInt(request.getPerformanceScore()),
                safeInt(request.getDesignScore()),
                endpoints,
                buildLogs,
                testLogs);
    }

    @SuppressWarnings("unchecked")
    private String extractGeminiText(Map<String, Object> raw) {
        Object cands = raw.get("candidates");
        if (!(cands instanceof List<?> list) || list.isEmpty()) {
            return null;
        }
        Object first = list.get(0);
        if (!(first instanceof Map<?, ?> firstMap)) {
            return null;
        }
        Object content = firstMap.get("content");
        if (!(content instanceof Map<?, ?> contentMap)) {
            return null;
        }
        Object parts = contentMap.get("parts");
        if (!(parts instanceof List<?> partList) || partList.isEmpty()) {
            return null;
        }
        Object firstPart = partList.get(0);
        if (!(firstPart instanceof Map<?, ?> partMap)) {
            return null;
        }
        Object text = partMap.get("text");
        if (text == null) {
            return null;
        }
        return text.toString().trim();
    }

    @SuppressWarnings("unchecked")
    private List<String> toStringList(Object raw) {
        if (!(raw instanceof List<?> list)) {
            return List.of();
        }
        List<String> values = new ArrayList<>();
        for (Object item : list) {
            if (item != null) {
                String text = item.toString().trim();
                if (!text.isBlank()) {
                    values.add(text);
                }
            }
        }
        return values;
    }

    private static int clamp(int val, int min, int max) {
        return Math.max(min, Math.min(max, val));
    }

    private static int safeInt(Object raw) {
        if (raw instanceof Number n) {
            return n.intValue();
        }
        return 0;
    }

    private String trimForPrompt(String input, int maxLen) {
        if (input == null || input.isBlank()) {
            return "(empty)";
        }
        if (input.length() <= maxLen) {
            return input;
        }
        return input.substring(0, maxLen) + "\n...[truncated]";
    }

    private Map<String, Object> mergeDiagnostics(Map<String, Object> base, Map<String, Object> extra) {
        Map<String, Object> merged = new LinkedHashMap<>();
        if (base != null) {
            merged.putAll(base);
        }
        merged.putAll(extra);
        return Collections.unmodifiableMap(merged);
    }

    private String safeLower(String raw) {
        return raw != null ? raw.toLowerCase(Locale.ROOT) : "";
    }
}
