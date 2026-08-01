package com.apiarena.authservice.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** A single TOTP code, used to enable/disable 2FA while already authenticated. */
@Data
public class TwoFactorCodeRequest {
    @NotBlank
    private String code;
}
