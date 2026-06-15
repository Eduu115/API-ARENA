package com.apiarena.authservice.model.services;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class WelcomeNotificationDispatchService {

    private static final Logger log = LoggerFactory.getLogger(WelcomeNotificationDispatchService.class);

    private final RestTemplate restTemplate;

    @Value("${services.notification-url:http://localhost:8090}")
    private String notificationServiceUrl;

    @Value("${services.internal-token:}")
    private String internalToken;

    public WelcomeNotificationDispatchService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public void sendWelcome(Long userId, String username) {
        if (userId == null) {
            return;
        }
        String base = notificationServiceUrl != null ? notificationServiceUrl.trim() : "http://localhost:8090";
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        String url = base + "/internal/notifications/welcome";

        Map<String, Object> body = new HashMap<>();
        body.put("userId", userId);
        body.put("username", username);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (internalToken != null && !internalToken.isBlank()) {
            headers.set("X-Internal-Token", internalToken.trim());
        }

        try {
            restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Void.class);
        } catch (Exception e) {
            log.warn("Could not create welcome notification for user {}: {}", userId, e.getMessage());
        }
    }
}
