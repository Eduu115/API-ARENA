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
public class NewChallengeNotificationDispatchService {

    private static final Logger log = LoggerFactory.getLogger(NewChallengeNotificationDispatchService.class);

    private final RestTemplate restTemplate;

    @Value("${services.notification-url:http://localhost:8090}")
    private String notificationServiceUrl;

    @Value("${services.internal-token:}")
    private String internalToken;

    public NewChallengeNotificationDispatchService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public void notifySubscriber(Long userId, Long challengeId, String challengeTitle, String locale) {
        if (userId == null || challengeId == null) {
            return;
        }
        if (internalToken == null || internalToken.isBlank()) {
            log.debug("Skip new-challenge in-app notification: services.internal-token is not set");
            return;
        }

        String base = notificationServiceUrl != null ? notificationServiceUrl.trim() : "http://localhost:8090";
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        String url = base + "/internal/notifications/new-challenge-published";

        Map<String, Object> body = new HashMap<>();
        body.put("userId", userId);
        body.put("challengeId", challengeId);
        body.put("challengeTitle", challengeTitle != null ? challengeTitle : "");
        if (locale != null && !locale.isBlank()) {
            body.put("locale", locale.trim());
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Token", internalToken.trim());

        try {
            restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Void.class);
        } catch (Exception e) {
            log.warn("Could not create new-challenge in-app notification for user {}: {}", userId, e.getMessage());
        }
    }
}
