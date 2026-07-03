package com.apiarena.authservice.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UnbanRequest {
    @NotBlank
    @Size(max = 120)
    private String reason;

    @Size(max = 500)
    private String description;
}
