package com.apiarena.authservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

@Configuration
@ConfigurationProperties(prefix = "jwt")
@Data
public class JwtProperties {

    private String secret;
    /** Duración del access token en milisegundos (p. ej. jwt.expiration=86400000). */
    private long expiration;
    /** Duración del refresh token en milisegundos. */
    private long refreshExpiration;

    /** Known leaked default shipped in earlier .env.example / properties — must never reach prod. */
    private static final String LEAKED_DEFAULT_SECRET = "myjwtsecretkey123456789abcdefghijklmnopqrstuvwxyz";

    /**
     * Fail fast at startup if the JWT signing key is missing, too short, or the historically
     * leaked default. auth-service is the token issuer, so refusing to boot here brings the whole
     * login flow down loudly instead of silently signing with a guessable key.
     */
    @jakarta.annotation.PostConstruct
    void validateSecret() {
        if (secret == null || secret.isBlank() || LEAKED_DEFAULT_SECRET.equals(secret)) {
            throw new IllegalStateException(
                    "jwt.secret is missing or uses the known default. Set a strong, unique JWT_SECRET.");
        }
        if (secret.length() < 32) {
            throw new IllegalStateException("jwt.secret too short; use at least 32 characters (256 bits).");
        }
    }
}
