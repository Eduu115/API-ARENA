package com.apiarena.authservice.model.services;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/** GDPR export and erasure for social-service. Best-effort: account deletion continues if the call fails. */
@Service
public class SocialDataDispatchService {

    private static final Logger log = LoggerFactory.getLogger(SocialDataDispatchService.class);

    private final RestTemplate restTemplate;

    @Value("${services.social-url:http://localhost:8091}")
    private String socialServiceUrl;

    @Value("${services.internal-token:}")
    private String internalToken;

    public SocialDataDispatchService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public boolean purgeUserData(Long userId) {
        if (userId == null) {
            return false;
        }
        try {
            restTemplate.exchange(base() + "/internal/users/" + userId + "/data",
                    HttpMethod.DELETE, new HttpEntity<>(headers()), Void.class);
            return true;
        } catch (Exception e) {
            log.error("Failed to purge social data for user {}: {}", userId, e.getMessage());
            return false;
        }
    }

    public Map<String, Object> exportUserData(Long userId) {
        if (userId == null) {
            return Map.of("unavailable", true);
        }
        try {
            Map<String, Object> body = restTemplate.exchange(
                    base() + "/internal/users/" + userId + "/export",
                    HttpMethod.GET,
                    new HttpEntity<>(headers()),
                    new ParameterizedTypeReference<Map<String, Object>>() {}).getBody();
            return body == null ? Map.of("unavailable", true) : body;
        } catch (Exception e) {
            log.error("Failed to export social data for user {}: {}", userId, e.getMessage());
            return Map.of("unavailable", true);
        }
    }

    private String base() {
        String base = socialServiceUrl == null ? "http://localhost:8091" : socialServiceUrl.trim();
        return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }

    private HttpHeaders headers() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Token", internalToken != null ? internalToken.trim() : "");
        return headers;
    }
}
