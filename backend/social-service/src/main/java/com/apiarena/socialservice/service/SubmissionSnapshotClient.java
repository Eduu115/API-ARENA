package com.apiarena.socialservice.service;

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

import com.apiarena.socialservice.domain.SnapshotSanitizer;

@Service
public class SubmissionSnapshotClient {

    private static final Logger log = LoggerFactory.getLogger(SubmissionSnapshotClient.class);

    private final RestTemplate restTemplate;
    private final InternalTokens tokens;
    private final String submissionUrl;

    public SubmissionSnapshotClient(
            RestTemplate restTemplate,
            InternalTokens tokens,
            @Value("${services.submission-url:http://localhost:8083}") String submissionUrl) {
        this.restTemplate = restTemplate;
        this.tokens = tokens;
        this.submissionUrl = submissionUrl.endsWith("/")
                ? submissionUrl.substring(0, submissionUrl.length() - 1)
                : submissionUrl;
    }

    public Map<String, Object> load(Long submissionId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Token", tokens.headerValue());
        Map<String, Object> raw = restTemplate.exchange(
                submissionUrl + "/internal/submissions/" + submissionId + "/social-snapshot",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<Map<String, Object>>() {}).getBody();
        Map<String, Object> clean = SnapshotSanitizer.sanitize(raw);
        log.debug("Sanitized social snapshot for submission {} keys {}", submissionId, clean.keySet());
        return clean;
    }
}
