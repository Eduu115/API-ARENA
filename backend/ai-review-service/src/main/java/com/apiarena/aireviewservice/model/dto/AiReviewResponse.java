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
    private int score;
    private String summary;
    private List<String> suggestions;
    private Map<String, Object> diagnostics;
}
