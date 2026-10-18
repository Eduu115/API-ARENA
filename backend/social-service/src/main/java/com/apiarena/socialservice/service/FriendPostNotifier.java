package com.apiarena.socialservice.service;

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
public class FriendPostNotifier {

    private static final Logger log = LoggerFactory.getLogger(FriendPostNotifier.class);

    private final RestTemplate restTemplate;
    private final InternalTokens tokens;
    private final String notificationUrl;

    public FriendPostNotifier(
            RestTemplate restTemplate,
            InternalTokens tokens,
            @Value("${services.notification-url:http://localhost:8090}") String notificationUrl) {
        this.restTemplate = restTemplate;
        this.tokens = tokens;
        this.notificationUrl = notificationUrl.endsWith("/")
                ? notificationUrl.substring(0, notificationUrl.length() - 1)
                : notificationUrl;
    }

    public void notifyFriend(Long recipientUserId, Long authorUserId, String authorUsername, Long postId, String challengeTitle) {
        if (recipientUserId == null || authorUserId == null || postId == null) {
            return;
        }
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Token", tokens.headerValue());
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, Object> body = Map.of(
                "recipientUserId", recipientUserId,
                "authorUserId", authorUserId,
                "authorUsername", authorUsername == null ? "" : authorUsername,
                "postId", postId,
                "challengeTitle", challengeTitle == null ? "" : challengeTitle);
        try {
            restTemplate.postForEntity(
                    notificationUrl + "/internal/notifications/friend-post",
                    new HttpEntity<>(body, headers),
                    Void.class);
        } catch (Exception e) {
            log.warn("Friend-post notification failed for {}: {}", recipientUserId, e.getMessage());
        }
    }
}
