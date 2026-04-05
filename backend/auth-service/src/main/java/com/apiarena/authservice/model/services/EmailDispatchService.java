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
import org.springframework.web.util.HtmlUtils;
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

    private String frontendBaseUrl() {
        String base = emailProperties.getFrontendBaseUrl() != null
                ? emailProperties.getFrontendBaseUrl().trim()
                : "http://localhost:3000";
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base;
    }

    public void sendVerificationEmail(String toEmail, String username, String token) {
        String base = frontendBaseUrl();
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

        postResend(toEmail, "Verify your API Arena email", html);
    }

    /**
     * Welcome + beta messaging; separate from in-app IMPORTANT notification (no duplicate copy).
     */
    public void sendWelcomeBetaLegacyEmail(String toEmail, String username) {
        String apiKey = emailProperties.getResendApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("RESEND_API_KEY not set; skip welcome email to {}", toEmail);
            return;
        }

        String safeName = username != null && !username.isBlank() ? HtmlUtils.htmlEscape(username.trim()) : "there";
        String html = """
                <div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#e8e8f0;background:#0a0a12;padding:24px;border-radius:12px;border:1px solid #1e293b;">
                  <h1 style="font-size:20px;margin:0 0 16px;color:#22d3ee;">Welcome to API Arena</h1>
                  <p style="line-height:1.5;margin:0 0 16px;">Hi %s,</p>
                  <p style="line-height:1.5;margin:0 0 16px;">Thank you for trusting us and creating an account.</p>
                  <p style="line-height:1.5;margin:0 0 16px;">We are currently in <strong style="color:#a78bfa;">beta</strong>. Your account is automatically marked as a <strong style="color:#22d3ee;">legacy</strong> account as an early supporter of this phase.</p>
                  <p style="line-height:1.5;margin:0 0 24px;">Please verify your email (separate message) to unlock the full experience. See you in the Arena.</p>
                  <p style="line-height:1.5;margin:0;font-size:13px;color:#94a3b8;">— The API Arena team</p>
                </div>
                """.formatted(safeName);

        postResend(toEmail, "Welcome to API Arena (beta)", html);
    }

    /**
     * Post-registration onboarding: quick tutorial and what is available during beta.
     */
    public void sendFirstStepsBetaEmail(String toEmail, String username) {
        String apiKey = emailProperties.getResendApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("RESEND_API_KEY not set; skip first-steps email to {}", toEmail);
            return;
        }

        String base = frontendBaseUrl();
        String safeName = username != null && !username.isBlank() ? HtmlUtils.htmlEscape(username.trim()) : "there";

        String html = """
                <div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#e8e8f0;background:#0a0a12;padding:24px;border-radius:12px;border:1px solid #1e293b;">
                  <h1 style="font-size:20px;margin:0 0 16px;color:#22d3ee;">Your first steps</h1>
                  <p style="line-height:1.5;margin:0 0 20px;">Hi %s,</p>
                  <p style="line-height:1.5;margin:0 0 16px;">Here is a short path to get value from <strong style="color:#a78bfa;">API Arena</strong> while we are in <strong>beta</strong>:</p>
                  <ol style="line-height:1.6;margin:0 0 20px;padding-left:20px;color:#e8e8f0;">
                    <li style="margin-bottom:10px;"><strong>Verify your email</strong> — unlock login and the full app. <a href="%s" style="color:#22d3ee;">Open verification</a> (or use the dedicated email we sent).</li>
                    <li style="margin-bottom:10px;"><strong>Browse challenges</strong> — filter by difficulty, category, and status. <a href="%s/challenges" style="color:#22d3ee;">Go to Challenges</a></li>
                    <li style="margin-bottom:10px;"><strong>Submit your API</strong> — upload a ZIP, run the sandbox pipeline, and get scored. From a challenge page, use Submit.</li>
                    <li style="margin-bottom:10px;"><strong>Track progress</strong> — <a href="%s/dashboard" style="color:#22d3ee;">Dashboard</a>, <a href="%s/submissions" style="color:#22d3ee;">My submissions</a>, and <a href="%s/leaderboard" style="color:#22d3ee;">Leaderboard</a>.</li>
                    <li style="margin-bottom:0;"><strong>Stay in the loop</strong> — <a href="%s/notifications" style="color:#22d3ee;">Notifications</a> (bell in the top bar) and <a href="%s/friends" style="color:#22d3ee;">Friends</a>.</li>
                  </ol>
                  <p style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;margin:0 0 12px;">Available in this beta</p>
                  <ul style="line-height:1.55;margin:0 0 20px;padding-left:20px;color:#cbd5e1;font-size:14px;">
                    <li>Challenge catalog, filters, and featured challenges</li>
                    <li>ZIP submission, sandbox build, automated HTTP testing, scores &amp; logs</li>
                    <li>XP, ELO, daily attempt limits, and submission completion events</li>
                    <li>In-app notifications (including important alerts by email when applicable)</li>
                    <li>Global and challenge leaderboards</li>
                    <li>Public profiles and friends</li>
                  </ul>
                  <p style="line-height:1.5;margin:0;font-size:13px;color:#94a3b8;">Things may change during beta—thank you for helping us shape the product. Questions? Reply to this email if your provider allows it, or use in-app notifications.</p>
                  <p style="line-height:1.5;margin:16px 0 0;font-size:13px;color:#94a3b8;">— The API Arena team</p>
                </div>
                """.formatted(safeName, base + "/verify-email", base, base, base, base, base, base);

        postResend(toEmail, "Your first steps in API Arena (beta)", html);
    }

    /**
     * Mirrors in-app ALERTS / IMPORTANT notifications to email.
     */
    public void sendNotificationAlertEmail(
            String toEmail,
            String username,
            String title,
            String body,
            String importanceName
    ) {
        String apiKey = emailProperties.getResendApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("RESEND_API_KEY not set; skip notification email to {}", toEmail);
            return;
        }

        String imp = importanceName != null ? importanceName.trim().toUpperCase() : "ALERT";
        String safeTitle = HtmlUtils.htmlEscape(title != null ? title : "");
        String safeBody = HtmlUtils.htmlEscape(body != null ? body : "");
        String safeName = username != null && !username.isBlank() ? HtmlUtils.htmlEscape(username.trim()) : "there";

        String html = """
                <div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#e8e8f0;background:#0a0a12;padding:24px;border-radius:12px;border:1px solid #1e293b;">
                  <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#a78bfa;margin:0 0 8px;">%s</p>
                  <h1 style="font-size:18px;margin:0 0 16px;color:#22d3ee;">%s</h1>
                  <p style="line-height:1.5;margin:0 0 12px;">Hi %s,</p>
                  <p style="line-height:1.5;margin:0 0 24px;white-space:pre-wrap;">%s</p>
                  <p style="line-height:1.5;margin:0;font-size:13px;color:#94a3b8;">This was sent because your in-app notification is classified as Alerts or Important.</p>
                </div>
                """.formatted(imp, safeTitle, safeName, safeBody);

        String subject = String.format("[API Arena] [%s] %s", imp, title != null ? title : "Notification");
        postResend(toEmail, subject, html);
    }

    private void postResend(String toEmail, String subject, String html) {
        String apiKey = emailProperties.getResendApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            return;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey.trim());

        Map<String, Object> body = new HashMap<>();
        body.put("from", emailProperties.getFrom());
        body.put("to", List.of(toEmail));
        body.put("subject", subject);
        body.put("html", html);

        try {
            restTemplate.postForEntity(RESEND_API, new HttpEntity<>(body, headers), Map.class);
            log.info("Email sent via Resend to {} subject={}", toEmail, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {} subject={}: {}", toEmail, subject, e.getMessage());
        }
    }
}
