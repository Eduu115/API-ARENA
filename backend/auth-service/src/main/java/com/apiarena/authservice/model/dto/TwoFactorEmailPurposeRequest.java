package com.apiarena.authservice.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** ENABLE or DISABLE. Login codes use the pending-token endpoint instead. */
@Data
public class TwoFactorEmailPurposeRequest {

    @NotBlank
    private String purpose;
}
