package com.apiarena.notificationservice.model.services;

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

import com.apiarena.notificationservice.model.entities.Notification;
import com.apiarena.notificationservice.model.entities.NotificationImportance;

@Service
public class NotificationEmailDispatchService {

    private static final Logger log = LoggerFactory.getLogger(NotificationEmailDispatchService.class);

    private final RestTemplate restTemplate;

    @Value("${services.auth-url:http://localhost:8081}")
    private String authServiceUrl;

    public NotificationEmailDispatchService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * ALERTS and IMPORTANT in-app notifications are mirrored to email via auth-service (Resend).
     * Skips {@link NotificationService#TYPE_WELCOME}: welcome uses a dedicated beta/legacy email from auth.
     */
    public void sendEmailIfAlertOrImportant(Notification n) {
        if (n == null || n.getUserId() == null) {
            return;
        }
        NotificationImportance imp = n.getImportance() != null ? n.getImportance() : NotificationImportance.INFO;
        if (imp != NotificationImportance.ALERTS && imp != NotificationImportance.IMPORTANT) {
            return;
        }
        if (NotificationService.TYPE_WELCOME.equals(n.getType())) {
            return;
        }

        String base = authServiceUrl != null ? authServiceUrl.trim() : "http://localhost:8081";
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        String url = base + "/internal/users/" + n.getUserId() + "/notification-email";

        Map<String, Object> body = new HashMap<>();
        body.put("title", n.getTitle() != null ? n.getTitle() : "");
        body.put("body", n.getBody() != null ? n.getBody() : "");
        body.put("importance", imp.name());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Void.class);
        } catch (Exception e) {
            log.warn("Could not mirror notification {} to email for user {}: {}", n.getId(), n.getUserId(), e.getMessage());
        }
    }
}
