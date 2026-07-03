package com.apiarena.authservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TwoFactorEnrollResponse {
    /** Base32 shared secret to add manually in an authenticator app. */
    private String secret;
    /** otpauth:// URI (for QR or manual key entry). */
    private String otpauthUri;
}
