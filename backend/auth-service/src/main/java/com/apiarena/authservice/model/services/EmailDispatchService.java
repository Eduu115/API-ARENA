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
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.HtmlUtils;
import org.springframework.web.util.UriComponentsBuilder;

import com.apiarena.authservice.config.EmailProperties;
import com.apiarena.authservice.util.LocaleSupport;

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

    private String frontendLocalePath(String locale, String path) {
        String normalized = LocaleSupport.normalize(locale);
        String suffix = path.startsWith("/") ? path : "/" + path;
        return frontendBaseUrl() + "/" + normalized + suffix;
    }

    public void sendVerificationEmail(String toEmail, String username, String token, String locale) {
        String link = UriComponentsBuilder.fromUriString(frontendLocalePath(locale, "/verify-email"))
                .queryParam("token", token)
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUri()
                .toString();

        String apiKey = emailProperties.getResendApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("RESEND_API_KEY not set; verification link for {}: {}", toEmail, link);
            return;
        }

        String safeName = username != null && !username.isBlank() ? username : "there";
        boolean es = "es".equals(LocaleSupport.normalize(locale));
        String html;
        String subject;
        if (es) {
            subject = "Verifica tu email de API Arena";
            html = """
                    <div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#e8e8f0;background:#0a0a12;padding:24px;border-radius:12px;border:1px solid #1e293b;">
                      <h1 style="font-size:20px;margin:0 0 16px;color:#22d3ee;">Verifica tu email</h1>
                      <p style="line-height:1.5;margin:0 0 16px;">Hola %s,</p>
                      <p style="line-height:1.5;margin:0 0 24px;">Confirma tu cuenta de API Arena haciendo clic en el botón.</p>
                      <a href="%s" style="display:inline-block;background:#22d3ee;color:#0a0a12;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Verificar email</a>
                      <p style="line-height:1.5;margin:24px 0 0;font-size:13px;color:#94a3b8;">Si no creaste una cuenta, puedes ignorar este mensaje.</p>
                    </div>
                    """.formatted(safeName, link);
        } else {
            subject = "Verify your API Arena email";
            html = """
                    <div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#e8e8f0;background:#0a0a12;padding:24px;border-radius:12px;border:1px solid #1e293b;">
                      <h1 style="font-size:20px;margin:0 0 16px;color:#22d3ee;">Verify your email</h1>
                      <p style="line-height:1.5;margin:0 0 16px;">Hi %s,</p>
                      <p style="line-height:1.5;margin:0 0 24px;">Confirm your API Arena account by clicking the button below.</p>
                      <a href="%s" style="display:inline-block;background:#22d3ee;color:#0a0a12;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Verify email</a>
                      <p style="line-height:1.5;margin:24px 0 0;font-size:13px;color:#94a3b8;">If you did not create an account, you can ignore this message.</p>
                    </div>
                    """.formatted(safeName, link);
        }

        postResend(toEmail, subject, html);
    }

    public void sendPasswordResetEmail(String toEmail, String username, String token, String locale) {
        String link = UriComponentsBuilder.fromUriString(frontendLocalePath(locale, "/reset-password"))
                .queryParam("token", token)
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUri()
                .toString();

        String apiKey = emailProperties.getResendApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("RESEND_API_KEY not set; password reset link for {}: {}", toEmail, link);
            return;
        }

        String safeName = username != null && !username.isBlank() ? HtmlUtils.htmlEscape(username.trim()) : "there";
        boolean es = "es".equals(LocaleSupport.normalize(locale));
        String html;
        String subject;
        if (es) {
            subject = "Restablece tu contraseña de API Arena";
            html = """
                    <div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#e8e8f0;background:#0a0a12;padding:24px;border-radius:12px;border:1px solid #1e293b;">
                      <h1 style="font-size:20px;margin:0 0 16px;color:#22d3ee;">Restablece tu contraseña</h1>
                      <p style="line-height:1.5;margin:0 0 16px;">Hola %s,</p>
                      <p style="line-height:1.5;margin:0 0 24px;">Recibimos una solicitud para restablecer tu contraseña. El enlace caduca en 1 hora.</p>
                      <a href="%s" style="display:inline-block;background:#22d3ee;color:#0a0a12;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Restablecer contraseña</a>
                      <p style="line-height:1.5;margin:24px 0 0;font-size:13px;color:#94a3b8;">Si no lo solicitaste, ignora este email; tu contraseña no cambiará.</p>
                    </div>
                    """.formatted(safeName, link);
        } else {
            subject = "Reset your API Arena password";
            html = """
                    <div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#e8e8f0;background:#0a0a12;padding:24px;border-radius:12px;border:1px solid #1e293b;">
                      <h1 style="font-size:20px;margin:0 0 16px;color:#22d3ee;">Reset your password</h1>
                      <p style="line-height:1.5;margin:0 0 16px;">Hi %s,</p>
                      <p style="line-height:1.5;margin:0 0 24px;">We received a request to reset your API Arena password. Click the button below to choose a new one. This link expires in 1 hour.</p>
                      <a href="%s" style="display:inline-block;background:#22d3ee;color:#0a0a12;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Reset password</a>
                      <p style="line-height:1.5;margin:24px 0 0;font-size:13px;color:#94a3b8;">If you did not request this, you can safely ignore this email; your password will not change.</p>
                    </div>
                    """.formatted(safeName, link);
        }

        postResend(toEmail, subject, html);
    }

    /**
     * Scheduled security reminder: rotate password periodically (every ~2 months).
     */
    public void sendPasswordRotationReminderEmail(String toEmail, String username) {
        String apiKey = emailProperties.getResendApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("RESEND_API_KEY not set; skip password rotation reminder to {}", toEmail);
            return;
        }

        String base = frontendBaseUrl();
        String forgotLink = base + "/forgot-password";
        String safeName = username != null && !username.isBlank() ? HtmlUtils.htmlEscape(username.trim()) : "there";

        String html = """
                <div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#e8e8f0;background:#0a0a12;padding:24px;border-radius:12px;border:1px solid #1e293b;">
                  <h1 style="font-size:20px;margin:0 0 16px;color:#22d3ee;">Time to update your password</h1>
                  <p style="line-height:1.5;margin:0 0 16px;">Hi %s,</p>
                  <p style="line-height:1.5;margin:0 0 16px;">For your security, we recommend changing your API Arena password every two months. If you have not updated it recently, now is a good time.</p>
                  <p style="line-height:1.5;margin:0 0 24px;">Use the link below to request a secure reset link by email. You will stay signed in on devices where you are already logged in until you complete the reset.</p>
                  <a href="%s" style="display:inline-block;background:#22d3ee;color:#0a0a12;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Change my password</a>
                  <p style="line-height:1.5;margin:24px 0 0;font-size:13px;color:#94a3b8;">If you recently changed your password, you can ignore this message. We send this reminder about every two months to help keep accounts secure.</p>
                </div>
                """.formatted(safeName, forgotLink);

        postResend(toEmail, "API Arena — password security reminder", html);
    }

    /**
     * Welcome + beta messaging; separate from in-app IMPORTANT notification (no duplicate copy).
     */
    public void sendWelcomeBetaLegacyEmail(String toEmail, String username, String locale) {
        String apiKey = emailProperties.getResendApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("RESEND_API_KEY not set; skip welcome email to {}", toEmail);
            return;
        }

        String safeName = username != null && !username.isBlank() ? HtmlUtils.htmlEscape(username.trim()) : "there";
        boolean es = "es".equals(LocaleSupport.normalize(locale));
        String html;
        String subject;
        if (es) {
            subject = "Bienvenido a API Arena (beta)";
            html = """
                    <div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#e8e8f0;background:#0a0a12;padding:24px;border-radius:12px;border:1px solid #1e293b;">
                      <h1 style="font-size:20px;margin:0 0 16px;color:#22d3ee;">Bienvenido a API Arena</h1>
                      <p style="line-height:1.5;margin:0 0 16px;">Hola %s,</p>
                      <p style="line-height:1.5;margin:0 0 16px;">Gracias por confiar en nosotros y crear una cuenta.</p>
                      <p style="line-height:1.5;margin:0 0 16px;">Estamos en <strong style="color:#a78bfa;">beta</strong>. Tu cuenta queda marcada como <strong style="color:#22d3ee;">legacy</strong> por apoyar esta fase temprana.</p>
                      <p style="line-height:1.5;margin:0 0 24px;">Tu email está verificado — ya puedes usar la app completa. Nos vemos en la Arena.</p>
                      <p style="line-height:1.5;margin:0;font-size:13px;color:#94a3b8;">— El equipo de API Arena</p>
                    </div>
                    """.formatted(safeName);
        } else {
            subject = "Welcome to API Arena (beta)";
            html = """
                    <div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#e8e8f0;background:#0a0a12;padding:24px;border-radius:12px;border:1px solid #1e293b;">
                      <h1 style="font-size:20px;margin:0 0 16px;color:#22d3ee;">Welcome to API Arena</h1>
                      <p style="line-height:1.5;margin:0 0 16px;">Hi %s,</p>
                      <p style="line-height:1.5;margin:0 0 16px;">Thank you for trusting us and creating an account.</p>
                      <p style="line-height:1.5;margin:0 0 16px;">We are currently in <strong style="color:#a78bfa;">beta</strong>. Your account is automatically marked as a <strong style="color:#22d3ee;">legacy</strong> account as an early supporter of this phase.</p>
                      <p style="line-height:1.5;margin:0 0 24px;">Your email is verified — you're ready to use the full app. See you in the Arena.</p>
                      <p style="line-height:1.5;margin:0;font-size:13px;color:#94a3b8;">— The API Arena team</p>
                    </div>
                    """.formatted(safeName);
        }

        postResend(toEmail, subject, html);
    }

    /**
     * Post-registration onboarding: quick tutorial and what is available during beta.
     */
    public void sendFirstStepsBetaEmail(String toEmail, String username, String locale) {
        String apiKey = emailProperties.getResendApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("RESEND_API_KEY not set; skip first-steps email to {}", toEmail);
            return;
        }

        String loc = LocaleSupport.normalize(locale);
        String login = frontendLocalePath(loc, "/login");
        String challenges = frontendLocalePath(loc, "/challenges");
        String dashboard = frontendLocalePath(loc, "/dashboard");
        String submissions = frontendLocalePath(loc, "/submissions");
        String leaderboard = frontendLocalePath(loc, "/leaderboard");
        String notifications = frontendLocalePath(loc, "/notifications");
        String friends = frontendLocalePath(loc, "/friends");
        String safeName = username != null && !username.isBlank() ? HtmlUtils.htmlEscape(username.trim()) : "there";
        boolean es = "es".equals(loc);
        String html;
        String subject;
        if (es) {
            subject = "Tus primeros pasos en API Arena (beta)";
            html = """
                    <div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#e8e8f0;background:#0a0a12;padding:24px;border-radius:12px;border:1px solid #1e293b;">
                      <h1 style="font-size:20px;margin:0 0 16px;color:#22d3ee;">Tus primeros pasos</h1>
                      <p style="line-height:1.5;margin:0 0 20px;">Hola %s,</p>
                      <p style="line-height:1.5;margin:0 0 16px;">Una ruta corta para sacar partido a <strong style="color:#a78bfa;">API Arena</strong> mientras estamos en <strong>beta</strong>:</p>
                      <ol style="line-height:1.6;margin:0 0 20px;padding-left:20px;color:#e8e8f0;">
                        <li style="margin-bottom:10px;"><strong>Ya estás listo</strong> — tu email está verificado. <a href="%s" style="color:#22d3ee;">Inicia sesión</a> y explora <a href="%s" style="color:#22d3ee;">Challenges</a> o tu <a href="%s" style="color:#22d3ee;">Dashboard</a>.</li>
                        <li style="margin-bottom:10px;"><strong>Envía tu API</strong> — sube un ZIP, ejecuta el pipeline sandbox y obtén nota.</li>
                        <li style="margin-bottom:10px;"><strong>Sigue tu progreso</strong> — <a href="%s" style="color:#22d3ee;">Dashboard</a>, <a href="%s" style="color:#22d3ee;">Mis entregas</a> y <a href="%s" style="color:#22d3ee;">Leaderboard</a>.</li>
                        <li style="margin-bottom:0;"><strong>Mantente al día</strong> — <a href="%s" style="color:#22d3ee;">Notificaciones</a> y <a href="%s" style="color:#22d3ee;">Amigos</a>.</li>
                      </ol>
                      <p style="line-height:1.5;margin:0;font-size:13px;color:#94a3b8;">— El equipo de API Arena</p>
                    </div>
                    """.formatted(safeName, login, challenges, dashboard, dashboard, submissions, leaderboard, notifications, friends);
        } else {
            subject = "Your first steps in API Arena (beta)";
            html = """
                    <div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#e8e8f0;background:#0a0a12;padding:24px;border-radius:12px;border:1px solid #1e293b;">
                      <h1 style="font-size:20px;margin:0 0 16px;color:#22d3ee;">Your first steps</h1>
                      <p style="line-height:1.5;margin:0 0 20px;">Hi %s,</p>
                      <p style="line-height:1.5;margin:0 0 16px;">Here is a short path to get value from <strong style="color:#a78bfa;">API Arena</strong> while we are in <strong>beta</strong>:</p>
                      <ol style="line-height:1.6;margin:0 0 20px;padding-left:20px;color:#e8e8f0;">
                        <li style="margin-bottom:10px;"><strong>You're all set</strong> — your email is verified. <a href="%s" style="color:#22d3ee;">Sign in</a>, then explore <a href="%s" style="color:#22d3ee;">Challenges</a> or your <a href="%s" style="color:#22d3ee;">Dashboard</a>.</li>
                        <li style="margin-bottom:10px;"><strong>Submit your API</strong> — upload a ZIP, run the sandbox pipeline, and get scored. From a challenge page, use Submit.</li>
                        <li style="margin-bottom:10px;"><strong>Track progress</strong> — <a href="%s" style="color:#22d3ee;">Dashboard</a>, <a href="%s" style="color:#22d3ee;">My submissions</a>, and <a href="%s" style="color:#22d3ee;">Leaderboard</a>.</li>
                        <li style="margin-bottom:0;"><strong>Stay in the loop</strong> — <a href="%s" style="color:#22d3ee;">Notifications</a> (bell in the top bar) and <a href="%s" style="color:#22d3ee;">Friends</a>.</li>
                      </ol>
                      <p style="line-height:1.5;margin:0;font-size:13px;color:#94a3b8;">— The API Arena team</p>
                    </div>
                    """.formatted(safeName, login, challenges, dashboard, dashboard, submissions, leaderboard, notifications, friends);
        }

        postResend(toEmail, subject, html);
    }

    /**
     * Opt-in alert when a challenge is published (Challenges page checkbox).
     */
    public void sendNewChallengePublishedEmail(String toEmail, String username, String challengeTitle, long challengeId, String locale) {
        String apiKey = emailProperties.getResendApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("RESEND_API_KEY not set; skip new-challenge alert to {}", toEmail);
            return;
        }

        String loc = LocaleSupport.normalize(locale);
        String link = frontendLocalePath(loc, "/challenges/" + challengeId);
        String settingsLink = frontendLocalePath(loc, "/challenges");
        String safeName = username != null && !username.isBlank() ? HtmlUtils.htmlEscape(username.trim()) : "there";
        String safeTitle = HtmlUtils.htmlEscape(challengeTitle != null ? challengeTitle : "New challenge");
        boolean es = "es".equals(loc);

        String html;
        String subject;
        if (es) {
            subject = "[API Arena] Nuevo challenge: " + (challengeTitle != null ? challengeTitle : "publicado");
            html = """
                    <div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#e8e8f0;background:#0a0a12;padding:24px;border-radius:12px;border:1px solid #1e293b;">
                      <h1 style="font-size:20px;margin:0 0 16px;color:#22d3ee;">Nuevo challenge en API Arena</h1>
                      <p style="line-height:1.5;margin:0 0 16px;">Hola %s,</p>
                      <p style="line-height:1.5;margin:0 0 20px;">Hay un nuevo challenge disponible: <strong style="color:#a78bfa;">%s</strong></p>
                      <a href="%s" style="display:inline-block;background:#22d3ee;color:#0a0a12;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Abrir challenge</a>
                      <p style="line-height:1.5;margin:24px 0 0;font-size:13px;color:#94a3b8;">Recibiste esto porque activaste alertas de nuevos challenges. <a href="%s" style="color:#22d3ee;">Gestionar alertas</a> en la página de Challenges.</p>
                    </div>
                    """.formatted(safeName, safeTitle, link, settingsLink);
        } else {
            subject = "[API Arena] New challenge: " + (challengeTitle != null ? challengeTitle : "published");
            html = """
                    <div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#e8e8f0;background:#0a0a12;padding:24px;border-radius:12px;border:1px solid #1e293b;">
                      <h1 style="font-size:20px;margin:0 0 16px;color:#22d3ee;">New challenge in API Arena</h1>
                      <p style="line-height:1.5;margin:0 0 16px;">Hi %s,</p>
                      <p style="line-height:1.5;margin:0 0 20px;">A new challenge is available: <strong style="color:#a78bfa;">%s</strong></p>
                      <a href="%s" style="display:inline-block;background:#22d3ee;color:#0a0a12;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Open challenge</a>
                      <p style="line-height:1.5;margin:24px 0 0;font-size:13px;color:#94a3b8;">You received this because you enabled new-challenge email alerts. <a href="%s" style="color:#22d3ee;">Unsubscribe / manage alerts</a> anytime from the Challenges page.</p>
                    </div>
                    """.formatted(safeName, safeTitle, link, settingsLink);
        }

        // RFC 2369 / 8058: let mail clients offer a native unsubscribe action.
        Map<String, String> headers = new HashMap<>();
        headers.put("List-Unsubscribe", "<mailto:privacy@apiarena.net?subject=unsubscribe>, <" + settingsLink + ">");
        headers.put("List-Unsubscribe-Post", "List-Unsubscribe=One-Click");

        postResend(toEmail, subject, html, headers);
    }

    /**
     * Mirrors in-app notifications to email (same title and body as the bell).
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
                  <p style="line-height:1.5;margin:0;font-size:13px;color:#94a3b8;">This email mirrors your in-app notification (bell in the top bar).</p>
                </div>
                """.formatted(imp, safeTitle, safeName, safeBody);

        String subject = String.format("[API Arena] [%s] %s", imp, title != null ? title : "Notification");
        postResend(toEmail, subject, html);
    }

    private void postResend(String toEmail, String subject, String html) {
        postResend(toEmail, subject, html, null);
    }

    private void postResend(String toEmail, String subject, String html, Map<String, String> extraHeaders) {
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
        if (extraHeaders != null && !extraHeaders.isEmpty()) {
            body.put("headers", extraHeaders);
        }

        try {
            restTemplate.postForEntity(RESEND_API, new HttpEntity<>(body, headers), Map.class);
            log.info("Email sent via Resend to {} subject={}", toEmail, subject);
        } catch (HttpStatusCodeException e) {
            log.error(
                    "Resend rejected email to {} subject={} status={} body={}",
                    toEmail,
                    subject,
                    e.getStatusCode().value(),
                    e.getResponseBodyAsString());
        } catch (RestClientException e) {
            log.error("Resend request failed for {} subject={}: {}", toEmail, subject, e.getMessage());
        } catch (Exception e) {
            log.error("Failed to send email to {} subject={}: {}", toEmail, subject, e.getMessage());
        }
    }
}
