package com.apiarena.authservice.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TwoFactorEnrollRequest {
    @NotBlank
    private String pendingToken;
}
