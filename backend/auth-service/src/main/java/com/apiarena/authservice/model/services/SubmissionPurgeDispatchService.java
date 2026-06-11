package com.apiarena.authservice.model.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Calls submission-service to erase a user's submissions/files as part of account deletion
 * (GDPR right to erasure). Best-effort: deletion of the account proceeds even if this fails,
 * but failures are logged for manual follow-up.
 */
@Service
public class SubmissionPurgeDispatchService {

    private static final Logger log = LoggerFactory.getLogger(SubmissionPurgeDispatchService.class);

    private final RestTemplate restTemplate;

    @Value("${services.submission-url:http://localhost:8083}")
    private String submissionServiceUrl;

    @Value("${services.internal-token:}")
    private String internalToken;

    public SubmissionPurgeDispatchService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public boolean purgeUserData(Long userId) {
        if (userId == null) {
            return false;
        }
        String base = submissionServiceUrl != null ? submissionServiceUrl.trim() : "http://localhost:8083";
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        String url = base + "/internal/users/" + userId + "/data";

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Token", internalToken != null ? internalToken.trim() : "");

        try {
            restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers), Void.class);
            return true;
        } catch (Exception e) {
            log.error("Failed to purge submissions for user {} during account deletion: {}", userId, e.getMessage());
            return false;
        }
    }
}
