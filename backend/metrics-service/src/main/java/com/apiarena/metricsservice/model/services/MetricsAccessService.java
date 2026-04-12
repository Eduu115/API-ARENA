package com.apiarena.metricsservice.model.services;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class MetricsAccessService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String authServiceUrl;

    public MetricsAccessService(@Value("${services.auth-url:http://localhost:8081}") String authServiceUrl) {
        this.authServiceUrl = authServiceUrl;
    }

    public boolean isAdminAuthorized(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            return false;
        }

        String meUrl = authServiceUrl.endsWith("/") ? authServiceUrl + "api/auth/me" : authServiceUrl + "/api/auth/me";
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authorizationHeader);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    meUrl,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class);
            Map body = response.getBody();
            if (body == null) {
                return false;
            }
            Object role = body.get("role");
            return role != null && "ADMIN".equalsIgnoreCase(String.valueOf(role));
        } catch (Exception ignored) {
            return false;
        }
    }
}
