package com.apiarena.authservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

@Configuration
@ConfigurationProperties(prefix = "jwt")
@Data
public class JwtProperties {

    private String secret;
    private long expiration;
    private long refreshExpiration;

    public long getExpiration() {
        return expiration/1000;
    }

    public long getRefreshExpiration() {
        return refreshExpiration/1000;
    }
}
