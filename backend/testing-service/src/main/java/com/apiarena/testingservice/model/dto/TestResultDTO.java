package com.apiarena.testingservice.model.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.apiarena.testingservice.model.entities.TestResult;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestResultDTO {

    private Long id;
    private Long submissionId;
    private String testName;
    private String testType;
    private String status;
    private String expectedResult;
    private String actualResult;
    private String errorMessage;
    private BigDecimal executionTimeMs;
    private String requestMethod;
    private String requestPath;
    private Integer responseStatus;
    private String responseBody;
    private Integer scoreAwarded;
    private Integer maxScore;
    private LocalDateTime createdAt;

    public static TestResultDTO fromEntity(TestResult e) {
        return TestResultDTO.builder()
                .id(e.getId())
                .submissionId(e.getSubmissionId())
                .testName(e.getTestName())
                .testType(e.getTestType() != null ? e.getTestType().name() : null)
                .status(e.getStatus() != null ? e.getStatus().name() : null)
                .expectedResult(e.getExpectedResult())
                .actualResult(e.getActualResult())
                .errorMessage(e.getErrorMessage())
                .executionTimeMs(e.getExecutionTimeMs())
                .requestMethod(e.getRequestMethod())
                .requestPath(e.getRequestPath())
                .responseStatus(e.getResponseStatus())
                .responseBody(e.getResponseBody())
                .scoreAwarded(e.getScoreAwarded())
                .maxScore(e.getMaxScore())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
