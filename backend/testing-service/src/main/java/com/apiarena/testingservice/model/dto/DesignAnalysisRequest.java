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
public class DesignAnalysisRequest {

    @NotNull
    private Long submissionId;

    @NotBlank
    private String containerUrl;

    private Map<String, Object> designCriteria;
}
