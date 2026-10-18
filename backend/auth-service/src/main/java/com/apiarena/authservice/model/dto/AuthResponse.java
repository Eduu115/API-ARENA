package com.apiarena.authservice.model.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder

public class AuthResponse {
    private UserDTO user;
    private String accessToken;
    private String refreshToken;

    /** Password OK, second factor still required (no tokens issued yet). */
    private Boolean twoFactorRequired;
    /** Whether an authenticator app is already enrolled. */
    private Boolean twoFactorEnrolled;
    /** TOTP or EMAIL: the method to ask for first. */
    private String twoFactorPrimary;
    /** Enabled methods the client may switch between. */
    private List<String> twoFactorMethods;
    /** True when this login may use an email code. */
    private Boolean emailTwoFactorAllowed;
    /** Short-lived token binding the pending 2FA step. */
    private String pendingToken;

    public AuthResponse(UserDTO user, String accessToken, String refreshToken) {
        this.user = user;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }

}
