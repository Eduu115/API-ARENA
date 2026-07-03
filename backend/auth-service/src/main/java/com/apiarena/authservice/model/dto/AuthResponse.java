package com.apiarena.authservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder

public class AuthResponse {
    private UserDTO user;
    private String accessToken;
    private String refreshToken;

    /** ADMIN login only: password OK but TOTP still required (no tokens issued yet). */
    private Boolean twoFactorRequired;
    /** ADMIN login only: whether this admin has already enrolled a TOTP secret. */
    private Boolean twoFactorEnrolled;
    /** ADMIN login only: short-lived token binding the pending 2FA step. */
    private String pendingToken;

    public AuthResponse(UserDTO user, String accessToken, String refreshToken) {
        this.user = user;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }

}
