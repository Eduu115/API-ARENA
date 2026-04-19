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
public class TeacherPenaltyApplyRequest {

    /** One of WRONG_DELIVERABLE_NAME, SPELLING_AND_DOCS, ... OTHER */
    private String presetKey;

    /** Optional note stored on the penalty entry. */
    private String customNote;

    /** Required when presetKey is OTHER: points to deduct (positive number). */
    private BigDecimal penaltyPoints;

    /** Required when presetKey is OTHER: short description of the issue. */
    private String customDescription;
}
