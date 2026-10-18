package com.apiarena.socialservice.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class InternalTokens {

    private static final String DEFAULT_INTERNAL_TOKEN = "apiarena-internal-token";

    @Value("${services.internal-token:}")
    private String internalToken;

    public void require(String token) {
        if (internalToken == null || internalToken.isBlank() || DEFAULT_INTERNAL_TOKEN.equals(internalToken)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Internal token not configured");
        }
        String presented = token == null ? "" : token.trim();
        if (!MessageDigest.isEqual(
                internalToken.getBytes(StandardCharsets.UTF_8),
                presented.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid internal token");
        }
    }

    public String headerValue() {
        return internalToken == null ? "" : internalToken.trim();
    }
}
