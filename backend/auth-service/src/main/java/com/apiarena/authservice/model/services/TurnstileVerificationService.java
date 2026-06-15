package com.apiarena.authservice.model.services;

import java.util.Map;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.apiarena.authservice.config.TurnstileProperties;
import com.apiarena.authservice.exception.TurnstileVerificationException;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class TurnstileVerificationService {

    private static final String SITE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    private final TurnstileProperties properties;
    private final RestTemplate restTemplate;

    public TurnstileVerificationService(TurnstileProperties properties, RestTemplate restTemplate) {
        this.properties = properties;
        this.restTemplate = restTemplate;
    }

    public void requireValidToken(String token, String remoteIp) {
        if (!properties.isConfigured()) {
            return;
        }
        if (token == null || token.isBlank()) {
            throw new TurnstileVerificationException("Captcha verification required");
        }

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("secret", properties.getSecretKey().trim());
        body.add("response", token.trim());
        if (remoteIp != null && !remoteIp.isBlank()) {
            body.add("remoteip", remoteIp.trim());
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(SITE_VERIFY_URL, entity, Map.class);
            Map<?, ?> payload = response.getBody();
            if (payload == null || !Boolean.TRUE.equals(payload.get("success"))) {
                log.warn("Turnstile verification failed: {}", payload != null ? payload.get("error-codes") : "empty body");
                throw new TurnstileVerificationException(
                        "Captcha verification failed. Please try again.");
            }
        } catch (RestClientException e) {
            log.error("Turnstile siteverify request failed", e);
            throw new TurnstileVerificationException(
                    "Captcha verification unavailable. Please try again shortly.");
        }
    }

    public static String resolveClientIp(jakarta.servlet.http.HttpServletRequest request) {
        String ip = request.getHeader("CF-Connecting-IP");
        if (ip == null || ip.isBlank()) {
            ip = request.getHeader("X-Forwarded-For");
            if (ip != null && ip.contains(",")) {
                ip = ip.split(",")[0].trim();
            }
        }
        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
