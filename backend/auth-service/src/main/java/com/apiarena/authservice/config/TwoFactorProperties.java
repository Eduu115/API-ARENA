package com.apiarena.authservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

/**
 * Admin email 2FA switch.
 *
 * <p>Admins must keep TOTP. An authenticator code is phishing-resistant; an email code is not,
 * and a compromised inbox would otherwise skip the admin bunker. Email stays a recovery method
 * and only when {@code APP_2FA_ADMIN_ALLOW_EMAIL=true}. Students may use email as a full method.
 */
@Data
@ConfigurationProperties(prefix = "app.two-factor")
public class TwoFactorProperties {

    /**
     * When false (the default), admins cannot enroll or sign in with email codes.
     */
    private boolean adminAllowEmail = false;
}
