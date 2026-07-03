package com.apiarena.authservice.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class WarnRequest {
    @NotBlank
    @Size(max = 500)
    private String reason;
}
