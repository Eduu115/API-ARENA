package com.apiarena.authservice.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminMessageRequest {
    @NotBlank
    @Size(max = 120)
    private String title;

    @NotBlank
    @Size(max = 2000)
    private String body;
}
