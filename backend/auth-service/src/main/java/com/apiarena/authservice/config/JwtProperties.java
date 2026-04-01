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
}
