package com.apiarena.challengeservice.model.services;

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
public class NewChallengePublishedNotifier {

    private static final Logger log = LoggerFactory.getLogger(NewChallengePublishedNotifier.class);

    private final RestTemplate restTemplate;

    @Value("${services.auth-url:http://localhost:8081}")
    private String authServiceUrl;

    @Value("${services.internal-token:}")
    private String internalToken;

    public NewChallengePublishedNotifier(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public void notifyAsync(Long challengeId, String title, Long createdByUserId) {
        if (internalToken == null || internalToken.isBlank()) {
            log.debug("Skip new-challenge subscriber emails: services.internal-token is not set");
            return;
        }
        if (challengeId == null) {
            return;
        }
        Thread.ofVirtual().start(() -> postToAuth(challengeId, title, createdByUserId));
    }

    private void postToAuth(Long challengeId, String title, Long createdByUserId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Internal-Token", internalToken.trim());
            Map<String, Object> body = new HashMap<>();
            body.put("challengeId", challengeId);
            body.put("title", title != null ? title : "");
            body.put("createdByUserId", createdByUserId);
            String url = authServiceUrl.replaceAll("/$", "") + "/internal/challenges/new-published";
            restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Void.class);
        } catch (Exception e) {
            log.warn("Could not notify auth for new challenge {}: {}", challengeId, e.getMessage());
        }
    }
}
