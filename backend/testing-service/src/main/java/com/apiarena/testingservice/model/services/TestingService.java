package com.apiarena.testingservice.model.services;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.testingservice.model.dto.DesignAnalysisRequest;
import com.apiarena.testingservice.model.dto.RunTestsRequest;
import com.apiarena.testingservice.model.dto.TestResultDTO;
import com.apiarena.testingservice.model.dto.TestSuiteResultDTO;
import com.apiarena.testingservice.model.entities.TestResult;
import com.apiarena.testingservice.repository.TestResultRepository;

@Service
public class TestingService {

    private static final Logger log = LoggerFactory.getLogger(TestingService.class);

    @Autowired
    private TestResultRepository testResultRepository;

    private final Random random = new Random();

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
        log.info("Running functional tests for submission {}", request.getSubmissionId());
        List<TestResult> results = simulateFunctionalTests(request);
        testResultRepository.saveAll(results);
        return buildSuiteResult(request.getSubmissionId(), results);
    }

    @Transactional
    public TestSuiteResultDTO runPerformanceTests(RunTestsRequest request) {
        log.info("Running performance tests for submission {}", request.getSubmissionId());
        List<TestResult> results = simulatePerformanceTests(request);
        testResultRepository.saveAll(results);
        return buildSuiteResult(request.getSubmissionId(), results);
    }

    @Transactional
    public TestSuiteResultDTO runDesignAnalysis(DesignAnalysisRequest request) {
        log.info("Running design analysis for submission {}", request.getSubmissionId());
        List<TestResult> results = simulateDesignAnalysis(request);
        testResultRepository.saveAll(results);
        return buildSuiteResult(request.getSubmissionId(), results);
    }

    @Transactional
    public TestSuiteResultDTO runAllTests(RunTestsRequest request) {
        log.info("Running full test suite for submission {}", request.getSubmissionId());
        List<TestResult> all = new ArrayList<>();
        all.addAll(simulateFunctionalTests(request));
        all.addAll(simulatePerformanceTests(request));
        all.addAll(simulateDesignAnalysis(
                new DesignAnalysisRequest(request.getSubmissionId(), request.getContainerUrl(), request.getDesignCriteria())
        ));
        testResultRepository.saveAll(all);
        return buildSuiteResult(request.getSubmissionId(), all);
    }

    private List<TestResult> simulateFunctionalTests(RunTestsRequest request) {
        String[][] endpoints = {
            {"GET",  "/api/items",     "200"},
            {"POST", "/api/items",     "201"},
            {"GET",  "/api/items/1",   "200"},
            {"PUT",  "/api/items/1",   "200"},
            {"DELETE","/api/items/1",  "204"},
            {"GET",  "/api/items/999", "404"},
        };

        @SuppressWarnings("unchecked")
        Map<String, Object> suite = request.getTestSuite();
        int testCount = (suite != null && suite.containsKey("items")) ? 6 : endpoints.length;

        List<TestResult> results = new ArrayList<>();
        for (int i = 0; i < testCount && i < endpoints.length; i++) {
            String[] ep = endpoints[i];
            boolean passed = random.nextDouble() < 0.8;
            int maxScore = 100;
            int scored = passed ? maxScore : 0;

            TestResult tr = new TestResult();
            tr.setSubmissionId(request.getSubmissionId());
            tr.setTestName("Functional: " + ep[0] + " " + ep[1]);
            tr.setTestType(TestResult.TestType.FUNCTIONAL);
            tr.setStatus(passed ? TestResult.TestStatus.PASSED : TestResult.TestStatus.FAILED);
            tr.setRequestMethod(ep[0]);
            tr.setRequestPath(ep[1]);
            tr.setExpectedResult("HTTP " + ep[2]);
            tr.setActualResult(passed ? "HTTP " + ep[2] : "HTTP 500");
            tr.setResponseStatus(passed ? Integer.parseInt(ep[2]) : 500);
            tr.setExecutionTimeMs(BigDecimal.valueOf(10 + random.nextInt(200)));
            tr.setScoreAwarded(scored);
            tr.setMaxScore(maxScore);
            if (!passed) tr.setErrorMessage("Expected " + ep[2] + " but got 500 Internal Server Error");
            results.add(tr);
        }
        return results;
    }

    private List<TestResult> simulatePerformanceTests(RunTestsRequest request) {
        String[] metrics = {"Throughput (RPS)", "Avg Response Time", "P95 Response Time", "P99 Response Time"};
        List<TestResult> results = new ArrayList<>();
        for (String metric : metrics) {
            boolean passed = random.nextDouble() < 0.75;
            int maxScore = 50;

            TestResult tr = new TestResult();
            tr.setSubmissionId(request.getSubmissionId());
            tr.setTestName("Performance: " + metric);
            tr.setTestType(TestResult.TestType.PERFORMANCE);
            tr.setStatus(passed ? TestResult.TestStatus.PASSED : TestResult.TestStatus.FAILED);
            tr.setRequestMethod("GET");
            tr.setRequestPath("/api/items");

            switch (metric) {
                case "Throughput (RPS)" -> {
                    int rps = 50 + random.nextInt(450);
                    tr.setExpectedResult(">= 100 RPS");
                    tr.setActualResult(rps + " RPS");
                    tr.setExecutionTimeMs(BigDecimal.valueOf(15000));
                }
                case "Avg Response Time" -> {
                    int ms = 5 + random.nextInt(195);
                    tr.setExpectedResult("<= 100ms");
                    tr.setActualResult(ms + "ms");
                    tr.setExecutionTimeMs(BigDecimal.valueOf(ms));
                }
                case "P95 Response Time" -> {
                    int ms = 20 + random.nextInt(280);
                    tr.setExpectedResult("<= 200ms");
                    tr.setActualResult(ms + "ms");
                    tr.setExecutionTimeMs(BigDecimal.valueOf(ms));
                }
                case "P99 Response Time" -> {
                    int ms = 50 + random.nextInt(450);
                    tr.setExpectedResult("<= 500ms");
                    tr.setActualResult(ms + "ms");
                    tr.setExecutionTimeMs(BigDecimal.valueOf(ms));
                }
            }

            tr.setScoreAwarded(passed ? maxScore : (int) (maxScore * 0.3));
            tr.setMaxScore(maxScore);
            if (!passed) tr.setErrorMessage("Metric " + metric + " below threshold");
            results.add(tr);
        }
        return results;
    }

    private List<TestResult> simulateDesignAnalysis(DesignAnalysisRequest request) {
        String[] checks = {
            "Proper HTTP status codes",
            "RESTful URL naming",
            "Content-Type headers",
            "Error response format",
            "Pagination support"
        };
        List<TestResult> results = new ArrayList<>();
        for (String check : checks) {
            boolean passed = random.nextDouble() < 0.7;
            int maxScore = 40;

            TestResult tr = new TestResult();
            tr.setSubmissionId(request.getSubmissionId());
            tr.setTestName("Design: " + check);
            tr.setTestType(TestResult.TestType.DESIGN);
            tr.setStatus(passed ? TestResult.TestStatus.PASSED : TestResult.TestStatus.FAILED);
            tr.setExpectedResult("Compliant");
            tr.setActualResult(passed ? "Compliant" : "Non-compliant");
            tr.setExecutionTimeMs(BigDecimal.valueOf(1 + random.nextInt(10)));
            tr.setScoreAwarded(passed ? maxScore : 0);
            tr.setMaxScore(maxScore);
            if (!passed) tr.setErrorMessage(check + ": does not follow REST best practices");
            results.add(tr);
        }
        return results;
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
                .totalScore(correctness + performance + design)
                .results(results.stream().map(TestResultDTO::fromEntity).toList())
                .build();
    }
}
