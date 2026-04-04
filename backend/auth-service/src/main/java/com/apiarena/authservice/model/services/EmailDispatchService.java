package com.apiarena.authservice.model.services;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.apiarena.authservice.config.EmailProperties;

@Service
public class EmailDispatchService {

    private static final Logger log = LoggerFactory.getLogger(EmailDispatchService.class);
    private static final String RESEND_API = "https://api.resend.com/emails";

    private final EmailProperties emailProperties;
    private final RestTemplate restTemplate;

    public EmailDispatchService(EmailProperties emailProperties, RestTemplate restTemplate) {
        this.emailProperties = emailProperties;
        this.restTemplate = restTemplate;
    }

    public void sendVerificationEmail(String toEmail, String username, String token) {
        String base = emailProperties.getFrontendBaseUrl() != null
                ? emailProperties.getFrontendBaseUrl().trim()
                : "http://localhost:3000";
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        URI link = UriComponentsBuilder.fromUriString(base + "/verify-email")
                .queryParam("token", token)
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUri();

        String apiKey = emailProperties.getResendApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("RESEND_API_KEY not set; verification link for {}: {}", toEmail, link);
            return;
        }

        String safeName = username != null && !username.isBlank() ? username : "there";
        String html = """
                <div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#e8e8f0;background:#0a0a12;padding:24px;border-radius:12px;border:1px solid #1e293b;">
                  <h1 style="font-size:20px;margin:0 0 16px;color:#22d3ee;">Verify your email</h1>
                  <p style="line-height:1.5;margin:0 0 16px;">Hi %s,</p>
                  <p style="line-height:1.5;margin:0 0 24px;">Confirm your API Arena account by clicking the button below.</p>
                  <a href="%s" style="display:inline-block;background:#22d3ee;color:#0a0a12;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Verify email</a>
                  <p style="line-height:1.5;margin:24px 0 0;font-size:13px;color:#94a3b8;">If you did not create an account, you can ignore this message.</p>
                </div>
                """.formatted(safeName, link);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey.trim());

        Map<String, Object> body = new HashMap<>();
        body.put("from", emailProperties.getFrom());
        body.put("to", List.of(toEmail));
        body.put("subject", "Verify your API Arena email");
        body.put("html", html);

        try {
            restTemplate.postForEntity(RESEND_API, new HttpEntity<>(body, headers), Map.class);
            log.info("Verification email sent via Resend to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
        }
    }
}
