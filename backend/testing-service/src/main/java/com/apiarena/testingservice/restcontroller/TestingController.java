package com.apiarena.testingservice.restcontroller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.testingservice.model.dto.DesignAnalysisRequest;
import com.apiarena.testingservice.model.dto.RunTestsRequest;
import com.apiarena.testingservice.model.dto.TestResultDTO;
import com.apiarena.testingservice.model.dto.TestSuiteResultDTO;
import com.apiarena.testingservice.model.entities.TestResult;
import com.apiarena.testingservice.model.services.TestingService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@Tag(name = "Testing", description = "Automated testing endpoints (functional, performance, design)")
public class TestingController {

    @Autowired
    private TestingService testingService;

    @PostMapping("/internal/testing/run")
    @Operation(summary = "Run full test suite", description = "Runs functional, performance and design tests against a containerized API")
    public ResponseEntity<TestSuiteResultDTO> runAllTests(@Valid @RequestBody RunTestsRequest request) {
        TestSuiteResultDTO result = testingService.runAllTests(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/internal/testing/functional")
    @Operation(summary = "Run functional tests", description = "Runs only functional/correctness tests")
    public ResponseEntity<TestSuiteResultDTO> runFunctionalTests(@Valid @RequestBody RunTestsRequest request) {
        TestSuiteResultDTO result = testingService.runFunctionalTests(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/internal/testing/performance")
    @Operation(summary = "Run performance tests", description = "Runs throughput and latency tests")
    public ResponseEntity<TestSuiteResultDTO> runPerformanceTests(@Valid @RequestBody RunTestsRequest request) {
        TestSuiteResultDTO result = testingService.runPerformanceTests(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/internal/testing/design-analysis")
    @Operation(summary = "Run design analysis", description = "Analyzes REST API design best practices")
    public ResponseEntity<TestSuiteResultDTO> runDesignAnalysis(@Valid @RequestBody DesignAnalysisRequest request) {
        TestSuiteResultDTO result = testingService.runDesignAnalysis(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/api/testing/results/{submissionId}")
    @Operation(summary = "Get test results", description = "Get all test results for a submission")
    public ResponseEntity<List<TestResultDTO>> getResults(@PathVariable Long submissionId) {
        return ResponseEntity.ok(testingService.getResultsBySubmission(submissionId));
    }

    @GetMapping("/api/testing/results/{submissionId}/type")
    @Operation(summary = "Get test results by type", description = "Get test results filtered by type (FUNCTIONAL, PERFORMANCE, DESIGN)")
    public ResponseEntity<List<TestResultDTO>> getResultsByType(
            @PathVariable Long submissionId,
            @RequestParam TestResult.TestType type) {
        return ResponseEntity.ok(testingService.getResultsByType(submissionId, type));
    }
}
