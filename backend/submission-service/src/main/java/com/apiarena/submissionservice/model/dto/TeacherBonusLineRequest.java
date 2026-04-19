package com.apiarena.submissionservice.model.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherBonusLineRequest {

    /** Optional stable id so edits keep the same row identity in UI. */
    @Size(max = 64)
    private String id;

    @NotNull(message = "points is required for each bonus line")
    @DecimalMin(value = "0.01", message = "points must be positive")
    @DecimalMax(value = "100.00", message = "points per line cannot exceed 100")
    private BigDecimal points;

    @Size(max = 200)
    private String label;

    @Size(max = 500)
    private String note;
}
