package com.apiarena.submissionservice.model.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherManualScoresRequest {

    private BigDecimal correctnessScore;
    private BigDecimal performanceScore;
    private BigDecimal designScore;
    private BigDecimal aiReviewScore;
}
