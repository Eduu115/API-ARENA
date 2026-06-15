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
public class AchievementNotificationDispatchService {

    private static final Logger log = LoggerFactory.getLogger(AchievementNotificationDispatchService.class);

    private final RestTemplate restTemplate;

    @Value("${services.notification-url:http://localhost:8090}")
    private String notificationServiceUrl;

    @Value("${services.internal-token:}")
    private String internalToken;

    public AchievementNotificationDispatchService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public void notifyUnlocked(Long userId, String achievementCode, String achievementTitle, String tier) {
        if (userId == null || achievementCode == null || achievementCode.isBlank()) {
            return;
        }
        String base = notificationServiceUrl != null ? notificationServiceUrl.trim() : "http://localhost:8090";
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        String url = base + "/internal/notifications/achievement-unlocked";

        Map<String, Object> body = new HashMap<>();
        body.put("userId", userId);
        body.put("achievementCode", achievementCode.trim());
        body.put("achievementTitle", achievementTitle != null && !achievementTitle.isBlank()
                ? achievementTitle.trim()
                : achievementCode.trim());
        if (tier != null && !tier.isBlank()) {
            body.put("tier", tier.trim());
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (internalToken != null && !internalToken.isBlank()) {
            headers.set("X-Internal-Token", internalToken.trim());
        }

        try {
            restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Void.class);
        } catch (Exception e) {
            log.warn("Could not create achievement notification for user {} code {}: {}",
                    userId, achievementCode, e.getMessage());
        }
    }
}
