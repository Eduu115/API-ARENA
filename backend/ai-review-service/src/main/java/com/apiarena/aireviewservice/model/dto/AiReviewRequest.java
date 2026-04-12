package com.apiarena.aireviewservice.model.dto;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AiReviewRequest {
    @NotNull
    private Long submissionId;
    @NotNull
    private Long challengeId;
    private String buildLogs;
    private String testLogs;
    private List<String> endpoints;
}
