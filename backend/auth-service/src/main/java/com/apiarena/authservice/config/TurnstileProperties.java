package com.apiarena.authservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

@Data
@ConfigurationProperties(prefix = "app.turnstile")
public class TurnstileProperties {

    /**
     * Cloudflare Turnstile secret key. When blank, verification is skipped (local dev).
     */
    private String secretKey = "";

    public boolean isConfigured() {
        return secretKey != null && !secretKey.isBlank();
    }
}
