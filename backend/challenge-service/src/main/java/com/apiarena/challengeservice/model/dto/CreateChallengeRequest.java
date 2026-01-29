package com.apiarena.challengeservice.model.dto;

import java.util.Map;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateChallengeRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Difficulty is required")
    private String difficulty;

    @NotBlank(message = "Category is required")
    @Size(max = 50)
    private String category;

    @Min(value = 1, message = "Max score must be at least 1")
    private Integer maxScore;

    @Min(value = 1, message = "Time limit must be at least 1 minute")
    private Integer timeLimitMinutes;

    private Map<String, Object> requiredEndpoints;
    private Map<String, Object> requiredStatusCodes;
    private Map<String, Object> requiredHeaders;
    private Map<String, Object> testSuite;
    private Map<String, Object> performanceRequirements;
    private Map<String, Object> designCriteria;
    private Map<String, Object> hints;
    private String solutionExplanation;
    private Map<String, Object> learningObjectives;
}