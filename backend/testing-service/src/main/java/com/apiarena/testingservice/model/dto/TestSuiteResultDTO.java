package com.apiarena.testingservice.model.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestSuiteResultDTO {

    private Long submissionId;
    private Integer totalTests;
    private Integer passed;
    private Integer failed;
    private Integer skipped;
    private Integer errors;
    private Integer correctnessScore;
    private Integer performanceScore;
    private Integer designScore;
    private Integer totalScore;
    private List<TestResultDTO> results;
}
