package com.apiarena.aireviewservice.model.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiReviewResponse {
    private int aiScore;
    private int score;
    private int overallScore;
    private int performanceScore;
    private int aestheticsScore;
    private int cleanlinessScore;
    private int structureScore;
    private String provider;
    private String summary;
    private List<String> strengths;
    private List<String> suggestions;
    private Map<String, Object> diagnostics;
}
