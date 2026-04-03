package com.apiarena.testingservice.model.services;

import java.math.BigDecimal;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import com.apiarena.testingservice.model.dto.DesignAnalysisRequest;
import com.apiarena.testingservice.model.dto.RunTestsRequest;
import com.apiarena.testingservice.model.dto.TestResultDTO;
import com.apiarena.testingservice.model.dto.TestSuiteResultDTO;
import com.apiarena.testingservice.model.entities.TestResult;
import com.apiarena.testingservice.repository.TestResultRepository;

@Service
public class TestingService {

    private static final Logger log = LoggerFactory.getLogger(TestingService.class);

    /** Default CRUD demo against /api/items (used when challenge has no HTTP endpoint list). */
    private static final String[][] DEFAULT_ENDPOINTS = {
            {"GET",  "/api/items",     "200", null},
            {"POST", "/api/items",     "201", "{\"name\":\"test\"}"},
            {"GET",  "/api/items/1",   "200", null},
            {"PUT",  "/api/items/1",   "200", "{\"name\":\"updated\"}"},
            {"DELETE","/api/items/1",  "204", null},
            {"GET",  "/api/items/999", "404", null},
    };

    private static final int MAX_CORRECTNESS = 600;
    private static final int MAX_PERFORMANCE = 200;
    private static final int MAX_DESIGN = 200;

    @Autowired
    private TestResultRepository testResultRepository;

    @Autowired
    private RestTemplate restTemplate;

    public List<TestResultDTO> getResultsBySubmission(Long submissionId) {
        return testResultRepository.findBySubmissionIdOrderByCreatedAtAsc(submissionId)
                .stream()
                .map(TestResultDTO::fromEntity)
                .toList();
    }

    public List<TestResultDTO> getResultsByType(Long submissionId, TestResult.TestType type) {
        return testResultRepository.findBySubmissionIdAndTestType(submissionId, type)
                .stream()
                .map(TestResultDTO::fromEntity)
                .toList();
    }

    @Transactional
    public TestSuiteResultDTO runFunctionalTests(RunTestsRequest request) {
        log.info("Running functional HTTP tests for submission {}", request.getSubmissionId());
        testResultRepository.deleteBySubmissionId(request.getSubmissionId());
        List<TestResult> results = runFunctionalHttpTests(request);
        testResultRepository.saveAll(results);
        return buildSuiteResult(request.getSubmissionId(), results);
    }

    @Transactional
    public TestSuiteResultDTO runPerformanceTests(RunTestsRequest request) {
        log.info("Running performance HTTP tests for submission {}", request.getSubmissionId());
        testResultRepository.deleteBySubmissionId(request.getSubmissionId());
        List<TestResult> results = runPerformanceHttpTests(request);
        testResultRepository.saveAll(results);
        return buildSuiteResult(request.getSubmissionId(), results);
    }

    @Transactional
    public TestSuiteResultDTO runDesignAnalysis(DesignAnalysisRequest request) {
        log.info("Running design HTTP checks for submission {}", request.getSubmissionId());
        testResultRepository.deleteBySubmissionId(request.getSubmissionId());
        List<TestResult> results = runDesignHttpChecks(request);
        testResultRepository.saveAll(results);
        return buildSuiteResult(request.getSubmissionId(), results);
    }

    @Transactional
    public TestSuiteResultDTO runAllTests(RunTestsRequest request) {
        log.info("Running full HTTP test suite for submission {}", request.getSubmissionId());
        testResultRepository.deleteBySubmissionId(request.getSubmissionId());
        List<TestResult> all = new ArrayList<>();
        all.addAll(runFunctionalHttpTests(request));
        all.addAll(runPerformanceHttpTests(request));
        all.addAll(runDesignHttpChecks(buildDesignRequest(request)));
        testResultRepository.saveAll(all);
        return buildSuiteResult(request.getSubmissionId(), all);
    }

    private List<TestResult> runFunctionalHttpTests(RunTestsRequest request) {
        String base = normalizeBaseUrl(request.getContainerUrl());
        Long sid = request.getSubmissionId();

        List<EndpointSpec> specs = resolveEndpointSpecs(request.getTestSuite());
        int n = specs.size();
        int perTestMax = n > 0 ? Math.max(1, MAX_CORRECTNESS / n) : 0;

        List<TestResult> results = new ArrayList<>();
        for (EndpointSpec ep : specs) {
            String method = ep.method();
            String path = ep.path();
            int expected = ep.expectStatus();
            String body = ep.body();

            long t0 = System.nanoTime();
            try {
                ResponseEntity<String> resp = exchange(base, method, path, body);
                long ms = (System.nanoTime() - t0) / 1_000_000L;
                int actual = resp.getStatusCode().value();
                boolean statusOk = actual == expected;
                String responseBody = resp.getBody();

                int score;
                if (!statusOk) {
                    score = 0;
                } else {
                    score = correctnessPointsForLatency(ms, perTestMax);
                    if (shouldValidateListJson(method, path) && responseBody != null) {
                        if (!bodyLooksLikeJsonArray(responseBody)) {
                            score = Math.max(0, (int) Math.round(score * 0.45));
                        }
                    }
                }

                TestResult tr = new TestResult();
                tr.setSubmissionId(sid);
                tr.setTestName("Functional: " + method + " " + path);
                tr.setTestType(TestResult.TestType.FUNCTIONAL);
                tr.setStatus(!statusOk || score == 0 ? TestResult.TestStatus.FAILED : TestResult.TestStatus.PASSED);
                tr.setRequestMethod(method);
                tr.setRequestPath(path);
                tr.setExpectedResult("HTTP " + expected + " (latency-weighted score)");
                tr.setActualResult("HTTP " + actual + ", " + ms + "ms, bodyLen=" + (responseBody != null ? responseBody.length() : 0));
                tr.setResponseStatus(actual);
                tr.setExecutionTimeMs(BigDecimal.valueOf(ms));
                tr.setScoreAwarded(score);
                tr.setMaxScore(perTestMax);
                if (!statusOk) {
                    tr.setErrorMessage("Expected " + expected + " but got " + actual);
                }
                results.add(tr);
            } catch (RestClientResponseException e) {
                long ms = (System.nanoTime() - t0) / 1_000_000L;
                int actual = e.getStatusCode().value();
                boolean statusOk = actual == expected;
                int score = statusOk ? correctnessPointsForLatency(ms, perTestMax) : 0;
                TestResult tr = new TestResult();
                tr.setSubmissionId(sid);
                tr.setTestName("Functional: " + method + " " + path);
                tr.setTestType(TestResult.TestType.FUNCTIONAL);
                tr.setStatus(statusOk ? TestResult.TestStatus.PASSED : TestResult.TestStatus.FAILED);
                tr.setRequestMethod(method);
                tr.setRequestPath(path);
                tr.setExpectedResult("HTTP " + expected);
                tr.setActualResult("HTTP " + actual);
                tr.setResponseStatus(actual);
                tr.setExecutionTimeMs(BigDecimal.valueOf(ms));
                tr.setScoreAwarded(score);
                tr.setMaxScore(perTestMax);
                if (!statusOk) {
                    tr.setErrorMessage(e.getMessage());
                }
                results.add(tr);
            } catch (ResourceAccessException e) {
                results.add(errorResult(sid, "Functional: " + method + " " + path,
                        TestResult.TestType.FUNCTIONAL, e.getMessage(), perTestMax));
            } catch (Exception e) {
                results.add(errorResult(sid, "Functional: " + method + " " + path,
                        TestResult.TestType.FUNCTIONAL, e.getMessage(), perTestMax));
            }
        }
        return results;
    }

    private DesignAnalysisRequest buildDesignRequest(RunTestsRequest request) {
        List<EndpointSpec> specs = resolveEndpointSpecs(request.getTestSuite());
        String probe = specs.stream()
                .filter(s -> "GET".equalsIgnoreCase(s.method()) && shouldValidateListJson(s.method(), s.path()))
                .map(EndpointSpec::path)
                .findFirst()
                .orElse("/api/items");
        DesignAnalysisRequest d = new DesignAnalysisRequest();
        d.setSubmissionId(request.getSubmissionId());
        d.setContainerUrl(request.getContainerUrl());
        d.setDesignCriteria(request.getDesignCriteria());
        d.setProbeGetPath(probe);
        return d;
    }

    /**
     * Lower score when latency is high even if status is correct (continuous, not binary).
     */
    private static int correctnessPointsForLatency(long ms, int maxPoints) {
        if (maxPoints <= 0) {
            return 0;
        }
        double m = Math.max(0, ms);
        // Smooth decay: fast responses get full points; very slow approach a floor.
        double factor = 1.0 / (1.0 + m / 55.0);
        double floor = 0.12;
        double weighted = floor + (1.0 - floor) * factor;
        return (int) Math.round(maxPoints * weighted);
    }

    private static boolean shouldValidateListJson(String method, String path) {
        if (!"GET".equalsIgnoreCase(method) || path == null) {
            return false;
        }
        String p = path.trim();
        return !p.matches(".*/\\d+$");
    }

    private static boolean bodyLooksLikeJsonArray(String body) {
        String b = body.trim();
        return b.startsWith("[");
    }

    private ResponseEntity<String> exchange(String base, String method, String path, String jsonBody) {
        URI uri = URI.create(base + path);
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON, MediaType.ALL));
        HttpMethod httpMethod = HttpMethod.valueOf(method);
        HttpEntity<String> entity;
        if (jsonBody != null && (method.equals("POST") || method.equals("PUT") || method.equals("PATCH"))) {
            headers.setContentType(MediaType.APPLICATION_JSON);
            entity = new HttpEntity<>(jsonBody, headers);
        } else {
            entity = new HttpEntity<>(headers);
        }
        return restTemplate.exchange(uri, httpMethod, entity, String.class);
    }

    private record EndpointSpec(String method, String path, int expectStatus, String body) {}

    /**
     * Builds HTTP cases from challenge JSON: testSuite.endpoints / items, or requiredEndpoints.items.
     * Skips WebSocket-only rows. Falls back to DEFAULT_ENDPOINTS when nothing usable is defined.
     */
    @SuppressWarnings("unchecked")
    private List<EndpointSpec> resolveEndpointSpecs(Map<String, Object> testSuite) {
        List<Map<String, Object>> raw = new ArrayList<>();
        if (testSuite != null) {
            addEndpointMaps(raw, testSuite.get("endpoints"));
            addEndpointMaps(raw, testSuite.get("items"));
            Object re = testSuite.get("requiredEndpoints");
            if (re instanceof Map<?, ?> rm) {
                addEndpointMaps(raw, rm.get("items"));
            }
        }
        if (raw.isEmpty()) {
            List<EndpointSpec> def = new ArrayList<>();
            for (String[] row : DEFAULT_ENDPOINTS) {
                def.add(new EndpointSpec(row[0], row[1], Integer.parseInt(row[2]), row[3]));
            }
            log.info("Using default /api/items functional suite ({} cases)", def.size());
            return def;
        }

        List<EndpointSpec> out = new ArrayList<>();
        for (Map<String, Object> ep : raw) {
            String method = Objects.toString(ep.get("method"), "GET").trim().toUpperCase(Locale.ROOT);
            if ("WS".equals(method) || "WEBSOCKET".equals(method)) {
                log.debug("Skipping WebSocket endpoint in automated HTTP suite");
                continue;
            }
            String path = substitutePathTemplate(Objects.toString(ep.get("path"), "").trim());
            if (path.isEmpty()) {
                continue;
            }
            if (!path.startsWith("/")) {
                path = "/" + path;
            }
            int expect = parseExpectStatus(ep.get("expectStatus"), method, path);
            String body = null;
            if (ep.get("body") != null) {
                body = Objects.toString(ep.get("body"), null);
            } else if (ep.get("jsonBody") != null) {
                body = Objects.toString(ep.get("jsonBody"), null);
            } else if ("POST".equals(method)) {
                body = inferDefaultPostBody(path);
            } else if ("PUT".equals(method) || "PATCH".equals(method)) {
                body = inferDefaultPutBody(path);
            }
            out.add(new EndpointSpec(method, path, expect, body));
        }

        if (out.isEmpty()) {
            List<EndpointSpec> def = new ArrayList<>();
            for (String[] row : DEFAULT_ENDPOINTS) {
                def.add(new EndpointSpec(row[0], row[1], Integer.parseInt(row[2]), row[3]));
            }
            log.warn("Challenge endpoint list produced no HTTP cases; using default suite");
            return def;
        }
        log.info("Running {} functional HTTP cases from challenge definition", out.size());
        return out;
    }

    @SuppressWarnings("unchecked")
    private static void addEndpointMaps(List<Map<String, Object>> target, Object raw) {
        if (!(raw instanceof List<?> list)) {
            return;
        }
        for (Object o : list) {
            if (o instanceof Map<?, ?> m) {
                target.add((Map<String, Object>) m);
            }
        }
    }

    private static String substitutePathTemplate(String path) {
        if (path == null || path.isEmpty()) {
            return "";
        }
        return path
                .replace("{id}", "1")
                .replace("{slug}", "abc")
                .replace("{cursor}", "")
                .replace("//", "/");
    }

    private static int parseExpectStatus(Object raw, String method, String path) {
        if (raw instanceof Number n) {
            return n.intValue();
        }
        if (raw != null) {
            try {
                return Integer.parseInt(raw.toString().trim());
            } catch (NumberFormatException ignored) {
                // fall through
            }
        }
        return inferExpectedStatus(method, path);
    }

    private static int inferExpectedStatus(String method, String path) {
        String m = method.toUpperCase(Locale.ROOT);
        if ("DELETE".equals(m)) {
            return 204;
        }
        if ("POST".equals(m)) {
            return 201;
        }
        if (path != null && path.matches(".*/999$")) {
            return 404;
        }
        return 200;
    }

    private static String inferDefaultPostBody(String path) {
        if (path.contains("/books")) {
            return "{\"title\":\"t\",\"author\":\"a\",\"isbn\":\"1\",\"price\":1,\"stock\":1}";
        }
        if (path.contains("/todos") || path.contains("/tasks")) {
            return "{\"title\":\"t\",\"description\":\"d\",\"completed\":false,\"priority\":\"LOW\"}";
        }
        if (path.contains("/auth/register")) {
            return "{\"email\":\"u@test.dev\",\"password\":\"Arena2025!Aa\",\"username\":\"u\"}";
        }
        if (path.contains("/auth/login")) {
            return "{\"email\":\"u@test.dev\",\"password\":\"Arena2025!Aa\"}";
        }
        if (path.contains("/auth/refresh")) {
            return "{\"refreshToken\":\"dummy\"}";
        }
        return "{\"name\":\"test\"}";
    }

    private static String inferDefaultPutBody(String path) {
        if (path.contains("/books")) {
            return "{\"title\":\"u\",\"author\":\"a\",\"isbn\":\"1\",\"price\":2,\"stock\":2}";
        }
        if (path.contains("/todos")) {
            return "{\"title\":\"u\",\"description\":\"d\",\"completed\":true,\"priority\":\"HIGH\"}";
        }
        return "{\"name\":\"updated\"}";
    }

    private List<TestResult> runPerformanceHttpTests(RunTestsRequest request) {
        String base = normalizeBaseUrl(request.getContainerUrl());
        Long sid = request.getSubmissionId();
        List<TestResult> results = new ArrayList<>();

        Map<String, Object> perfReq = request.getPerformanceRequirements();
        double targetLatencyMs = 55;
        double targetP95Ms = 95;
        double targetRps = 450;
        if (perfReq != null) {
            if (perfReq.get("maxAvgLatencyMs") instanceof Number n) {
                targetLatencyMs = Math.max(20, n.doubleValue());
            }
            if (perfReq.get("minRps") instanceof Number n) {
                targetRps = Math.max(50, n.doubleValue());
            }
        }

        String path = resolvePerformanceSamplePath(request.getTestSuite());
        int warmup = 3;
        int samples = 40;
        long totalMs = 0;
        int okCount = 0;

        try {
            for (int i = 0; i < warmup + samples; i++) {
                long t0 = System.nanoTime();
                ResponseEntity<String> resp = restTemplate.exchange(
                        URI.create(base + path), HttpMethod.GET, new HttpEntity<>(new HttpHeaders()), String.class);
                long ms = (System.nanoTime() - t0) / 1_000_000L;
                if (i >= warmup) {
                    totalMs += ms;
                    if (resp.getStatusCode().value() == 200) {
                        okCount++;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Performance sampling failed: {}", e.getMessage());
            TestResult tr = errorResult(sid, "Performance: latency sample", TestResult.TestType.PERFORMANCE, e.getMessage(), 50);
            results.add(tr);
            return results;
        }

        double avg = samples > 0 ? (double) totalMs / samples : 999;
        double p95Est = avg * 1.5;
        int rps = avg > 0 ? (int) (1000.0 / avg) : 0;

        int sLatency = perfPointsContinuous(avg, targetLatencyMs, 50);
        int sP95 = perfPointsContinuous(p95Est, targetP95Ms * 1.4, 50);
        int sRps = (int) Math.round(50.0 * Math.min(1.0, rps / targetRps));
        double successRatio = samples > 0 ? (double) okCount / samples : 0;
        int sOk = (int) Math.round(50.0 * successRatio);

        results.add(perfResult(sid, path, "Avg latency vs target", "<= " + (int) targetLatencyMs + "ms ideal",
                String.format(Locale.US, "%.1fms", avg), sLatency, 50));
        results.add(perfResult(sid, path, "P95 estimate vs target", "<= ~" + (int) (targetP95Ms * 1.4) + "ms",
                String.format(Locale.US, "%.1fms", p95Est), sP95, 50));
        results.add(perfResult(sid, path, "Throughput (est. RPS)", ">= " + (int) targetRps + " ideal",
                rps + " RPS", sRps, 50));
        results.add(perfResult(sid, path, "Success rate (sampled GETs)", "100%", okCount + "/" + samples, sOk, 50));

        return results;
    }

    private String resolvePerformanceSamplePath(Map<String, Object> testSuite) {
        List<EndpointSpec> specs = resolveEndpointSpecs(testSuite);
        return specs.stream()
                .filter(s -> "GET".equalsIgnoreCase(s.method()) && shouldValidateListJson("GET", s.path()))
                .map(EndpointSpec::path)
                .findFirst()
                .orElseGet(() -> specs.stream()
                        .filter(s -> "GET".equalsIgnoreCase(s.method()))
                        .map(EndpointSpec::path)
                        .findFirst()
                        .orElse("/api/items"));
    }

    /**
     * Higher score when value is lower than target (latency-style); 0..maxPoints.
     */
    private static int perfPointsContinuous(double value, double target, int maxPoints) {
        if (maxPoints <= 0) {
            return 0;
        }
        if (value <= 0) {
            return maxPoints;
        }
        double ratio = value / Math.max(target, 1e-6);
        double score = Math.exp(-Math.max(0, ratio - 0.35) * 2.2);
        return (int) Math.round(maxPoints * Math.min(1.0, Math.max(0.0, score)));
    }

    private static TestResult perfResult(Long sid, String requestPath, String name, String expected, String actual, int awarded, int max) {
        TestResult tr = new TestResult();
        tr.setSubmissionId(sid);
        tr.setTestName("Performance: " + name);
        tr.setTestType(TestResult.TestType.PERFORMANCE);
        tr.setRequestMethod("GET");
        tr.setRequestPath(requestPath);
        tr.setExpectedResult(expected);
        tr.setActualResult(actual);
        tr.setScoreAwarded(awarded);
        tr.setMaxScore(max);
        tr.setStatus(awarded >= max * 0.38 ? TestResult.TestStatus.PASSED : TestResult.TestStatus.FAILED);
        if (awarded < max * 0.38) {
            tr.setErrorMessage("Below scoring threshold for this metric");
        }
        return tr;
    }

    private List<TestResult> runDesignHttpChecks(DesignAnalysisRequest request) {
        String base = normalizeBaseUrl(request.getContainerUrl());
        Long sid = request.getSubmissionId();
        List<TestResult> results = new ArrayList<>();
        int perCheck = 40;
        String probePath = request.getProbeGetPath() != null && !request.getProbeGetPath().isBlank()
                ? request.getProbeGetPath() : "/api/items";

        try {
            ResponseEntity<String> r = restTemplate.exchange(
                    URI.create(base + probePath), HttpMethod.GET,
                    new HttpEntity<>(new HttpHeaders()), String.class);

            String ct = r.getHeaders().getFirst(HttpHeaders.CONTENT_TYPE);
            boolean jsonCt = ct != null && ct.toLowerCase(Locale.ROOT).contains("json");
            int ctScore = jsonCt ? perCheck : (ct != null && ct.toLowerCase(Locale.ROOT).contains("text") ? 12 : 0);
            results.add(designGraded(sid, "Content-Type JSON", "application/json", ct != null ? ct : "(none)", ctScore, perCheck));

            String body = r.getBody() != null ? r.getBody() : "";
            boolean looksArray = body.trim().startsWith("[");
            boolean validJson = looksArray || body.trim().startsWith("{");
            int arrScore = looksArray ? perCheck : (validJson ? 18 : 0);
            results.add(designGraded(sid, "List response JSON array", "[…]",
                    body.length() > 200 ? body.substring(0, 200) + "…" : body, arrScore, perCheck));

            boolean smallPayload = body.length() < 500_000;
            results.add(designGraded(sid, "Payload size reasonable", "< 500KB", body.length() + " chars",
                    smallPayload ? perCheck : 8, perCheck));

            int stScore = r.getStatusCode().value() == 200 ? perCheck : 0;
            results.add(designGraded(sid, "GET list status", "200", String.valueOf(r.getStatusCode().value()),
                    stScore, perCheck));

            String dateHdr = r.getHeaders().getFirst("Date");
            int dateScore = dateHdr != null ? perCheck : 6;
            results.add(designGraded(sid, "Date response header", "present", dateHdr != null ? dateHdr : "(none)",
                    dateScore, perCheck));

        } catch (Exception e) {
            results.add(errorResult(sid, "Design: HTTP GET " + probePath, TestResult.TestType.DESIGN, e.getMessage(), perCheck));
        }

        return results;
    }

    private static TestResult designGraded(Long sid, String name, String expected, String actual, int awarded, int max) {
        TestResult tr = new TestResult();
        tr.setSubmissionId(sid);
        tr.setTestName("Design: " + name);
        tr.setTestType(TestResult.TestType.DESIGN);
        tr.setStatus(awarded >= max * 0.28 ? TestResult.TestStatus.PASSED : TestResult.TestStatus.FAILED);
        tr.setExpectedResult(expected);
        tr.setActualResult(actual);
        tr.setScoreAwarded(awarded);
        tr.setMaxScore(max);
        if (awarded < max) {
            tr.setErrorMessage("Partial or no credit");
        }
        return tr;
    }

    private TestResult errorResult(Long sid, String name, TestResult.TestType type, String err, int maxScore) {
        TestResult tr = new TestResult();
        tr.setSubmissionId(sid);
        tr.setTestName(name);
        tr.setTestType(type);
        tr.setStatus(TestResult.TestStatus.ERROR);
        tr.setErrorMessage(err);
        tr.setScoreAwarded(0);
        tr.setMaxScore(type == TestResult.TestType.FUNCTIONAL ? maxScore : 50);
        return tr;
    }

    private static String normalizeBaseUrl(String url) {
        if (url == null) {
            return "";
        }
        String u = url.trim();
        while (u.endsWith("/")) {
            u = u.substring(0, u.length() - 1);
        }
        return u;
    }

    private TestSuiteResultDTO buildSuiteResult(Long submissionId, List<TestResult> results) {
        int passed = 0, failed = 0, skipped = 0, errors = 0;
        int correctness = 0, performance = 0, design = 0;

        for (TestResult r : results) {
            switch (r.getStatus()) {
                case PASSED -> passed++;
                case FAILED -> failed++;
                case SKIPPED -> skipped++;
                case ERROR -> errors++;
            }
            int score = r.getScoreAwarded() != null ? r.getScoreAwarded() : 0;
            switch (r.getTestType()) {
                case FUNCTIONAL -> correctness += score;
                case PERFORMANCE -> performance += score;
                case DESIGN -> design += score;
            }
        }

        correctness = Math.min(MAX_CORRECTNESS, correctness);
        performance = Math.min(MAX_PERFORMANCE, performance);
        design = Math.min(MAX_DESIGN, design);
        int total = correctness + performance + design;

        return TestSuiteResultDTO.builder()
                .submissionId(submissionId)
                .totalTests(results.size())
                .passed(passed)
                .failed(failed)
                .skipped(skipped)
                .errors(errors)
                .correctnessScore(correctness)
                .performanceScore(performance)
                .designScore(design)
                .totalScore(Math.min(1000, total))
                .results(results.stream().map(TestResultDTO::fromEntity).toList())
                .build();
    }
}
