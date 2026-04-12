package com.apiarena.authservice.model.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DevelopmentTimeDeltaRequest {

    @NotNull
    @Min(1)
    @Max(604800)
    private Integer seconds;
}
