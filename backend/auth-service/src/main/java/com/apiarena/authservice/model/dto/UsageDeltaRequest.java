package com.apiarena.authservice.model.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UsageDeltaRequest {

    /** Active browsing seconds to add (strict cap per request to limit client abuse). */
    @NotNull
    @Min(0)
    @Max(120)
    private Integer browsingSecondsDelta;
}
