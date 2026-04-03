package com.apiarena.testingservice.model.dto;

import java.util.Map;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RunTestsRequest {

    @NotNull
    private Long submissionId;

    @NotNull
    private Long challengeId;

    @NotBlank
    private String containerUrl;

    private Map<String, Object> testSuite;

    private Map<String, Object> performanceRequirements;

    private Map<String, Object> designCriteria;
}
