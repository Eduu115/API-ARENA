package com.apiarena.authservice.model.services;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
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

    /** Product tokens. Purple text is AA only on the page background, so the body sits on that surface. */
    private static final String BG = "#0A0E27";
    private static final String CYAN = "#00D9FF";
    private static final String PURPLE = "#B24BF3";
    private static final String TEXT = "#E8EDF4";
    private static final String MUTED = "#8B95AD";
    private static final String LINE = "#1E2439";
    private static final String FONT_DISPLAY = "'Barlow Condensed','Arial Narrow',Impact,sans-serif";
    private static final String FONT_BODY = "Syne,'Segoe UI',Arial,sans-serif";
    private static final String FONT_MONO = "'Share Tech Mono','Courier New',Courier,monospace";

    private final EmailProperties emailProperties;
    private final RestTemplate restTemplate;

    public EmailDispatchService(EmailProperties emailProperties, RestTemplate restTemplate) {
        this.emailProperties = emailProperties;
        this.restTemplate = restTemplate;
    }

    /** HTML document plus the plain-text alternative sent to Resend. */
    public record RenderedEmail(String subject, String html, String text) {}

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

    private static boolean spanish(String locale) {
        return "es".equals(LocaleSupport.normalize(locale));
    }

    private static String displayName(String username, String fallback) {
        if (username == null || username.isBlank()) {
            return fallback;
        }
        return username.trim();
    }

    private static String esc(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }

    private static String p(String innerHtml) {
        return "<p style=\"margin:0 0 16px;font-family:" + FONT_BODY
                + ";font-size:16px;line-height:1.6;color:" + TEXT + ";\">" + innerHtml + "</p>";
    }

    private static String mutedLine(String innerHtml) {
        return "<p style=\"margin:0;font-family:" + FONT_BODY
                + ";font-size:13px;line-height:1.5;color:" + MUTED + ";\">" + innerHtml + "</p>";
    }

    private static String a(String href, String label) {
        return "<a href=\"" + esc(href) + "\" target=\"_blank\" style=\"color:" + CYAN
                + ";text-decoration:underline;\">" + esc(label) + "</a>";
    }

    private static String steps(String... items) {
        StringBuilder sb = new StringBuilder();
        sb.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin:0 0 8px;\">");
        for (int i = 0; i < items.length; i++) {
            sb.append("<tr><td valign=\"top\" width=\"28\" style=\"width:28px;padding:0 8px 12px 0;font-family:")
                    .append(FONT_MONO)
                    .append(";font-size:14px;line-height:1.6;color:").append(CYAN).append(";\">")
                    .append(i + 1).append(".</td><td valign=\"top\" style=\"padding:0 0 12px;font-family:")
                    .append(FONT_BODY)
                    .append(";font-size:16px;line-height:1.6;color:").append(TEXT).append(";\">")
                    .append(items[i]).append("</td></tr>");
        }
        sb.append("</table>");
        return sb.toString();
    }

    private String verificationLink(String token, String locale) {
        return UriComponentsBuilder.fromUriString(frontendLocalePath(locale, "/verify-email"))
                .queryParam("token", token)
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUri()
                .toString();
    }

    private String resetLink(String token, String locale) {
        return UriComponentsBuilder.fromUriString(frontendLocalePath(locale, "/reset-password"))
                .queryParam("token", token)
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUri()
                .toString();
    }

    public void sendVerificationEmail(String toEmail, String username, String token, String locale) {
        if (resendKeyMissing()) {
            log.warn("RESEND_API_KEY not set; verification link for {}: {}", toEmail, verificationLink(token, locale));
            return;
        }
        postResend(toEmail, composeVerificationEmail(username, token, locale), null);
    }

    public void sendPasswordResetEmail(String toEmail, String username, String token, String locale) {
        if (resendKeyMissing()) {
            log.warn("RESEND_API_KEY not set; password reset link for {}: {}", toEmail, resetLink(token, locale));
            return;
        }
        postResend(toEmail, composePasswordResetEmail(username, token, locale), null);
    }

    /**
     * Scheduled security reminder: rotate password periodically (every ~4 months).
     * English only — this method has no locale argument on main.
     */
    public void sendPasswordRotationReminderEmail(String toEmail, String username) {
        if (resendKeyMissing()) {
            log.warn("RESEND_API_KEY not set; skip password rotation reminder to {}", toEmail);
            return;
        }
        postResend(toEmail, composePasswordRotationReminderEmail(username), null);
    }

    /**
     * Confirms a deferred account deletion: the account is gone, the email is reserved until {@code reservedUntil},
     * it's irreversible, and full/immediate erasure of the archived copy is via the privacy contact.
     */
    public void sendAccountDeletionEmail(String toEmail, String username,
            LocalDateTime reservedUntil, String locale) {
        if (resendKeyMissing()) {
            log.warn("RESEND_API_KEY not set; skip account deletion email to {}", toEmail);
            return;
        }
        postResend(toEmail, composeAccountDeletionEmail(username, reservedUntil, locale), null);
    }

    /**
     * Welcome + beta messaging; separate from in-app IMPORTANT notification (no duplicate copy).
     */
    public void sendWelcomeBetaLegacyEmail(String toEmail, String username, String locale) {
        if (resendKeyMissing()) {
            log.warn("RESEND_API_KEY not set; skip welcome email to {}", toEmail);
            return;
        }
        postResend(toEmail, composeWelcomeBetaLegacyEmail(username, locale), null);
    }

    /**
     * Post-registration onboarding: quick tutorial and what is available during beta.
     */
    public void sendFirstStepsBetaEmail(String toEmail, String username, String locale) {
        if (resendKeyMissing()) {
            log.warn("RESEND_API_KEY not set; skip first-steps email to {}", toEmail);
            return;
        }
        postResend(toEmail, composeFirstStepsBetaEmail(username, locale), null);
    }

    /**
     * Opt-in alert when a challenge is published (Challenges page checkbox).
     */
    public void sendNewChallengePublishedEmail(String toEmail, String username, String challengeTitle, long challengeId, String locale) {
        if (resendKeyMissing()) {
            log.warn("RESEND_API_KEY not set; skip new-challenge alert to {}", toEmail);
            return;
        }
        String settingsLink = frontendLocalePath(LocaleSupport.normalize(locale), "/challenges");
        Map<String, String> headers = new HashMap<>();
        headers.put("List-Unsubscribe", "<mailto:privacy@apiarena.net?subject=unsubscribe>, <" + settingsLink + ">");
        headers.put("List-Unsubscribe-Post", "List-Unsubscribe=One-Click");
        postResend(toEmail, composeNewChallengePublishedEmail(username, challengeTitle, challengeId, locale), headers);
    }

    /**
     * Mirrors in-app notifications to email (same title and body as the bell).
     * English only — this method has no locale argument on main.
     */
    public void sendNotificationAlertEmail(
            String toEmail,
            String username,
            String title,
            String body,
            String importanceName
    ) {
        if (resendKeyMissing()) {
            log.warn("RESEND_API_KEY not set; skip notification email to {}", toEmail);
            return;
        }
        postResend(toEmail, composeNotificationAlertEmail(username, title, body, importanceName), null);
    }

    RenderedEmail composeVerificationEmail(String username, String token, String locale) {
        String link = verificationLink(token, locale);
        String safeName = esc(displayName(username, "there"));
        boolean es = spanish(locale);
        if (es) {
            return layout(new EmailLayout(
                    "Verifica tu email de API Arena",
                    locale,
                    "Confirma tu cuenta de API Arena haciendo clic en el botón.",
                    null,
                    "Verifica tu email",
                    p("Hola " + safeName + ",")
                            + p("Confirma tu cuenta de API Arena haciendo clic en el botón."),
                    "Hola " + displayName(username, "there") + ",\n\nConfirma tu cuenta de API Arena haciendo clic en el botón.",
                    "Verificar email",
                    link,
                    "Si no creaste una cuenta, puedes ignorar este mensaje.",
                    false));
        }
        return layout(new EmailLayout(
                "Verify your API Arena email",
                locale,
                "Confirm your API Arena account by clicking the button below.",
                null,
                "Verify your email",
                p("Hi " + safeName + ",")
                        + p("Confirm your API Arena account by clicking the button below."),
                "Hi " + displayName(username, "there") + ",\n\nConfirm your API Arena account by clicking the button below.",
                "Verify email",
                link,
                "If you did not create an account, you can ignore this message.",
                false));
    }

    RenderedEmail composePasswordResetEmail(String username, String token, String locale) {
        String link = resetLink(token, locale);
        String safeName = esc(displayName(username, "there"));
        String rawName = displayName(username, "there");
        boolean es = spanish(locale);
        if (es) {
            return layout(new EmailLayout(
                    "Restablece tu contraseña de API Arena",
                    locale,
                    "Recibimos una solicitud para restablecer tu contraseña. El enlace caduca en 1 hora.",
                    null,
                    "Restablece tu contraseña",
                    p("Hola " + safeName + ",")
                            + p("Recibimos una solicitud para restablecer tu contraseña. El enlace caduca en 1 hora."),
                    "Hola " + rawName + ",\n\nRecibimos una solicitud para restablecer tu contraseña. El enlace caduca en 1 hora.",
                    "Restablecer contraseña",
                    link,
                    "Si no lo solicitaste, ignora este email; tu contraseña no cambiará.",
                    false));
        }
        return layout(new EmailLayout(
                "Reset your API Arena password",
                locale,
                "We received a request to reset your API Arena password. This link expires in 1 hour.",
                null,
                "Reset your password",
                p("Hi " + safeName + ",")
                        + p("We received a request to reset your API Arena password. Click the button below to choose a new one. This link expires in 1 hour."),
                "Hi " + rawName + ",\n\nWe received a request to reset your API Arena password. Click the button below to choose a new one. This link expires in 1 hour.",
                "Reset password",
                link,
                "If you did not request this, you can safely ignore this email; your password will not change.",
                false));
    }

    RenderedEmail composePasswordRotationReminderEmail(String username) {
        String forgotLink = frontendBaseUrl() + "/forgot-password";
        String safeName = esc(displayName(username, "there"));
        String rawName = displayName(username, "there");
        return layout(new EmailLayout(
                "API Arena — password security reminder",
                "en",
                "For your security, we recommend changing your API Arena password every four months.",
                null,
                "Time to update your password",
                p("Hi " + safeName + ",")
                        + p("For your security, we recommend changing your API Arena password every four months. If you have not updated it recently, now is a good time.")
                        + p("Use the link below to request a secure reset link by email. You will stay signed in on devices where you are already logged in until you complete the reset."),
                "Hi " + rawName + ",\n\nFor your security, we recommend changing your API Arena password every four months. If you have not updated it recently, now is a good time.\n\nUse the link below to request a secure reset link by email. You will stay signed in on devices where you are already logged in until you complete the reset.",
                "Change my password",
                forgotLink,
                "If you recently changed your password, you can ignore this message. We send this reminder about every four months to help keep accounts secure.",
                false));
    }

    RenderedEmail composeAccountDeletionEmail(String username, LocalDateTime reservedUntil, String locale) {
        // Preserve the historical locale check: only an exact "es" (any case), not LocaleSupport.normalize.
        boolean es = "es".equalsIgnoreCase(locale);
        String rawName = displayName(username, es ? "hola" : "there");
        String safeName = esc(rawName);
        String until = reservedUntil.toLocalDate().toString();
        String privacy = emailProperties.getSupportPrivacyEmail();
        String privacyHtml = "<a href=\"mailto:" + esc(privacy) + "\" style=\"color:" + CYAN
                + ";text-decoration:underline;\">" + esc(privacy) + "</a>";
        if (es) {
            return layout(new EmailLayout(
                    "API Arena — tu cuenta ha sido eliminada",
                    es ? "es" : "en",
                    "Hemos eliminado tu cuenta de API Arena. Esta acción es irreversible.",
                    null,
                    "Tu cuenta ha sido eliminada",
                    p("Hola " + safeName + ",")
                            + p("Hemos eliminado tu cuenta de API Arena. Esta acción es <strong>irreversible</strong>.")
                            + p("Tu dirección de correo queda <strong>reservada hasta el " + esc(until) + "</strong> (unas 2 semanas), el tiempo que tardamos en trasladar tu información a un almacén aparte y liberar la cuenta por completo. Durante ese periodo no podrás crear una cuenta nueva con este correo.")
                            + p("Si quieres que borremos <strong>todos tus datos de forma completa</strong>, incluida la copia archivada, escríbenos a " + privacyHtml + "."),
                    "Hola " + rawName + ",\n\nHemos eliminado tu cuenta de API Arena. Esta acción es irreversible.\n\nTu dirección de correo queda reservada hasta el " + until + " (unas 2 semanas), el tiempo que tardamos en trasladar tu información a un almacén aparte y liberar la cuenta por completo. Durante ese periodo no podrás crear una cuenta nueva con este correo.\n\nSi quieres que borremos todos tus datos de forma completa, incluida la copia archivada, escríbenos a " + privacy + ".",
                    null,
                    null,
                    "Recibes este email porque tu cuenta de API Arena ha sido eliminada.",
                    true));
        }
        return layout(new EmailLayout(
                "API Arena — your account has been deleted",
                "en",
                "Your API Arena account has been deleted. This action is irreversible.",
                null,
                "Your account has been deleted",
                p("Hi " + safeName + ",")
                        + p("Your API Arena account has been deleted. This action is <strong>irreversible</strong>.")
                        + p("Your email address is <strong>reserved until " + esc(until) + "</strong> (about 2 weeks) while we move your information to a separate store and fully release the account. You can't create a new account with this email during that period.")
                        + p("If you want us to erase <strong>all of your data completely</strong>, including the archived copy, email us at " + privacyHtml + "."),
                "Hi " + rawName + ",\n\nYour API Arena account has been deleted. This action is irreversible.\n\nYour email address is reserved until " + until + " (about 2 weeks) while we move your information to a separate store and fully release the account. You can't create a new account with this email during that period.\n\nIf you want us to erase all of your data completely, including the archived copy, email us at " + privacy + ".",
                null,
                null,
                "You received this email because your API Arena account was deleted.",
                true));
    }

    RenderedEmail composeWelcomeBetaLegacyEmail(String username, String locale) {
        String safeName = esc(displayName(username, "there"));
        String rawName = displayName(username, "there");
        boolean es = spanish(locale);
        if (es) {
            return layout(new EmailLayout(
                    "Bienvenido a API Arena (beta)",
                    locale,
                    "Gracias por confiar en nosotros y crear una cuenta.",
                    null,
                    "Bienvenido a API Arena",
                    p("Hola " + safeName + ",")
                            + p("Gracias por confiar en nosotros y crear una cuenta.")
                            + p("Estamos en <strong style=\"color:" + PURPLE + ";\">beta</strong>. Tu cuenta queda marcada como <strong style=\"color:" + CYAN + ";\">legacy</strong> por apoyar esta fase temprana.")
                            + p("Tu email está verificado — ya puedes usar la app completa. Nos vemos en la Arena.")
                            + mutedLine("— El equipo de API Arena"),
                    "Hola " + rawName + ",\n\nGracias por confiar en nosotros y crear una cuenta.\n\nEstamos en beta. Tu cuenta queda marcada como legacy por apoyar esta fase temprana.\n\nTu email está verificado — ya puedes usar la app completa. Nos vemos en la Arena.\n\n— El equipo de API Arena",
                    null,
                    null,
                    "Recibes este email porque verificaste tu cuenta de API Arena.",
                    false));
        }
        return layout(new EmailLayout(
                "Welcome to API Arena (beta)",
                locale,
                "Thank you for trusting us and creating an account.",
                null,
                "Welcome to API Arena",
                p("Hi " + safeName + ",")
                        + p("Thank you for trusting us and creating an account.")
                        + p("We are currently in <strong style=\"color:" + PURPLE + ";\">beta</strong>. Your account is automatically marked as a <strong style=\"color:" + CYAN + ";\">legacy</strong> account as an early supporter of this phase.")
                        + p("Your email is verified — you're ready to use the full app. See you in the Arena.")
                        + mutedLine("— The API Arena team"),
                "Hi " + rawName + ",\n\nThank you for trusting us and creating an account.\n\nWe are currently in beta. Your account is automatically marked as a legacy account as an early supporter of this phase.\n\nYour email is verified — you're ready to use the full app. See you in the Arena.\n\n— The API Arena team",
                null,
                null,
                "You received this email because you verified your API Arena account.",
                false));
    }

    RenderedEmail composeFirstStepsBetaEmail(String username, String locale) {
        String loc = LocaleSupport.normalize(locale);
        String login = frontendLocalePath(loc, "/login");
        String challenges = frontendLocalePath(loc, "/challenges");
        String dashboard = frontendLocalePath(loc, "/dashboard");
        String submissions = frontendLocalePath(loc, "/submissions");
        String leaderboard = frontendLocalePath(loc, "/leaderboard");
        String notifications = frontendLocalePath(loc, "/notifications");
        String friends = frontendLocalePath(loc, "/friends");
        String safeName = esc(displayName(username, "there"));
        String rawName = displayName(username, "there");
        boolean es = spanish(locale);
        if (es) {
            return layout(new EmailLayout(
                    "Tus primeros pasos en API Arena (beta)",
                    locale,
                    "Una ruta corta para sacar partido a API Arena mientras estamos en beta.",
                    null,
                    "Tus primeros pasos",
                    p("Hola " + safeName + ",")
                            + p("Una ruta corta para sacar partido a <strong style=\"color:" + PURPLE + ";\">API Arena</strong> mientras estamos en <strong>beta</strong>:")
                            + steps(
                                    "<strong>Ya estás listo</strong> — tu email está verificado. " + a(login, "Inicia sesión") + " y explora " + a(challenges, "Challenges") + " o tu " + a(dashboard, "Dashboard") + ".",
                                    "<strong>Envía tu API</strong> — sube un ZIP, ejecuta el pipeline sandbox y obtén nota.",
                                    "<strong>Sigue tu progreso</strong> — " + a(dashboard, "Dashboard") + ", " + a(submissions, "Mis entregas") + " y " + a(leaderboard, "Leaderboard") + ".",
                                    "<strong>Mantente al día</strong> — " + a(notifications, "Notificaciones") + " y " + a(friends, "Amigos") + ".")
                            + mutedLine("— El equipo de API Arena"),
                    "Hola " + rawName + ",\n\nUna ruta corta para sacar partido a API Arena mientras estamos en beta:\n\n1. Ya estás listo — tu email está verificado. Inicia sesión (" + login + ") y explora Challenges (" + challenges + ") o tu Dashboard (" + dashboard + ").\n2. Envía tu API — sube un ZIP, ejecuta el pipeline sandbox y obtén nota.\n3. Sigue tu progreso — Dashboard (" + dashboard + "), Mis entregas (" + submissions + ") y Leaderboard (" + leaderboard + ").\n4. Mantente al día — Notificaciones (" + notifications + ") y Amigos (" + friends + ").\n\n— El equipo de API Arena",
                    "Inicia sesión",
                    login,
                    "Recibes este email porque verificaste tu cuenta de API Arena.",
                    false));
        }
        return layout(new EmailLayout(
                "Your first steps in API Arena (beta)",
                locale,
                "Here is a short path to get value from API Arena while we are in beta.",
                null,
                "Your first steps",
                p("Hi " + safeName + ",")
                        + p("Here is a short path to get value from <strong style=\"color:" + PURPLE + ";\">API Arena</strong> while we are in <strong>beta</strong>:")
                        + steps(
                                "<strong>You're all set</strong> — your email is verified. " + a(login, "Sign in") + ", then explore " + a(challenges, "Challenges") + " or your " + a(dashboard, "Dashboard") + ".",
                                "<strong>Submit your API</strong> — upload a ZIP, run the sandbox pipeline, and get scored. From a challenge page, use Submit.",
                                "<strong>Track progress</strong> — " + a(dashboard, "Dashboard") + ", " + a(submissions, "My submissions") + ", and " + a(leaderboard, "Leaderboard") + ".",
                                "<strong>Stay in the loop</strong> — " + a(notifications, "Notifications") + " (bell in the top bar) and " + a(friends, "Friends") + ".")
                        + mutedLine("— The API Arena team"),
                "Hi " + rawName + ",\n\nHere is a short path to get value from API Arena while we are in beta:\n\n1. You're all set — your email is verified. Sign in (" + login + "), then explore Challenges (" + challenges + ") or your Dashboard (" + dashboard + ").\n2. Submit your API — upload a ZIP, run the sandbox pipeline, and get scored. From a challenge page, use Submit.\n3. Track progress — Dashboard (" + dashboard + "), My submissions (" + submissions + "), and Leaderboard (" + leaderboard + ").\n4. Stay in the loop — Notifications (" + notifications + ") (bell in the top bar) and Friends (" + friends + ").\n\n— The API Arena team",
                "Sign in",
                login,
                "You received this email because you verified your API Arena account.",
                false));
    }

    RenderedEmail composeNewChallengePublishedEmail(String username, String challengeTitle, long challengeId, String locale) {
        String loc = LocaleSupport.normalize(locale);
        String link = frontendLocalePath(loc, "/challenges/" + challengeId);
        String settingsLink = frontendLocalePath(loc, "/challenges");
        String safeName = esc(displayName(username, "there"));
        String rawName = displayName(username, "there");
        String safeTitle = esc(challengeTitle != null ? challengeTitle : "New challenge");
        String rawTitle = challengeTitle != null ? challengeTitle : "New challenge";
        boolean es = spanish(locale);
        String subjectTitle = challengeTitle != null ? challengeTitle : (es ? "publicado" : "published");
        if (es) {
            return layout(new EmailLayout(
                    "[API Arena] Nuevo challenge: " + subjectTitle,
                    locale,
                    "Hay un nuevo challenge disponible: " + rawTitle,
                    null,
                    "Nuevo challenge en API Arena",
                    p("Hola " + safeName + ",")
                            + p("Hay un nuevo challenge disponible: <strong style=\"color:" + PURPLE + ";\">" + safeTitle + "</strong>"),
                    "Hola " + rawName + ",\n\nHay un nuevo challenge disponible: " + rawTitle,
                    "Abrir challenge",
                    link,
                    "Recibiste esto porque activaste alertas de nuevos challenges. " + a(settingsLink, "Gestionar alertas") + " en la página de Challenges.",
                    "Recibiste esto porque activaste alertas de nuevos challenges. Gestionar alertas (" + settingsLink + ") en la página de Challenges.",
                    false));
        }
        return layout(new EmailLayout(
                "[API Arena] New challenge: " + subjectTitle,
                locale,
                "A new challenge is available: " + rawTitle,
                null,
                "New challenge in API Arena",
                p("Hi " + safeName + ",")
                        + p("A new challenge is available: <strong style=\"color:" + PURPLE + ";\">" + safeTitle + "</strong>"),
                "Hi " + rawName + ",\n\nA new challenge is available: " + rawTitle,
                "Open challenge",
                link,
                "You received this because you enabled new-challenge email alerts. " + a(settingsLink, "Unsubscribe / manage alerts") + " anytime from the Challenges page.",
                "You received this because you enabled new-challenge email alerts. Unsubscribe / manage alerts (" + settingsLink + ") anytime from the Challenges page.",
                false));
    }

    RenderedEmail composeNotificationAlertEmail(String username, String title, String body, String importanceName) {
        String imp = importanceName != null ? importanceName.trim().toUpperCase() : "ALERT";
        String rawTitle = title != null ? title : "";
        String rawBody = body != null ? body : "";
        String rawName = displayName(username, "there");
        String subject = "[API Arena] [" + imp + "] " + (title != null ? title : "Notification");
        String bodyHtml = esc(rawBody).replace("\r\n", "\n").replace("\n", "<br>");
        return layout(new EmailLayout(
                subject,
                "en",
                rawBody.isBlank() ? rawTitle : rawBody,
                imp,
                rawTitle,
                p("Hi " + esc(rawName) + ",")
                        + p(bodyHtml),
                "Hi " + rawName + ",\n\n" + rawBody,
                null,
                null,
                "This email mirrors your in-app notification (bell in the top bar).",
                false));
    }

    private boolean resendKeyMissing() {
        String apiKey = emailProperties.getResendApiKey();
        return apiKey == null || apiKey.isBlank();
    }

    /**
     * One shared shell for every transactional email: brand header, body, optional bulletproof CTA,
     * and a footer with why the message was sent, legal links, and the privacy contact when that email already uses it.
     * Callers pass localized copy. This method does not translate.
     * Body and reason HTML are inserted as markup; heading, preheader, and CTA label are escaped here.
     */
    private RenderedEmail layout(EmailLayout m) {
        String lang = LocaleSupport.normalize(m.locale());
        String reasonHtml = m.reasonHtml() != null ? m.reasonHtml() : esc(m.reasonText());
        StringBuilder html = new StringBuilder(6144);
        html.append("<!DOCTYPE html><html lang=\"").append(lang)
                .append("\" xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:v=\"urn:schemas-microsoft-com:vml\" xmlns:o=\"urn:schemas-microsoft-com:office:office\">");
        html.append("<head><meta charset=\"utf-8\">");
        html.append("<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">");
        html.append("<meta name=\"color-scheme\" content=\"dark\"><meta name=\"supported-color-schemes\" content=\"dark\">");
        html.append("<meta name=\"x-apple-disable-message-reformatting\">");
        html.append("<title>").append(esc(m.subject())).append("</title>");
        html.append("<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->");
        html.append("<style>");
        html.append(":root{color-scheme:dark;supported-color-schemes:dark;}");
        html.append("body,table,td{font-family:").append(FONT_BODY).append(";}");
        html.append("a{color:").append(CYAN).append(";}");
        html.append("@media (prefers-color-scheme:dark){");
        html.append(".email-bg,.container{background-color:").append(BG).append(" !important;}");
        html.append(".text-primary{color:").append(TEXT).append(" !important;}");
        html.append(".text-cyan{color:").append(CYAN).append(" !important;}");
        html.append(".text-purple{color:").append(PURPLE).append(" !important;}");
        html.append(".text-muted{color:").append(MUTED).append(" !important;}");
        html.append(".stripe-cyan{background-color:").append(CYAN).append(" !important;}");
        html.append(".stripe-purple{background-color:").append(PURPLE).append(" !important;}");
        html.append(".btn-td,.btn-a{background-color:").append(CYAN).append(" !important;}");
        html.append(".btn-a{color:").append(BG).append(" !important;}");
        html.append("}");
        html.append("[data-ogsc] .text-primary{color:").append(TEXT).append(" !important;}");
        html.append("[data-ogsc] .text-muted{color:").append(MUTED).append(" !important;}");
        html.append("[data-ogsc] .btn-a{color:").append(BG).append(" !important;}");
        html.append("[data-ogsb] .email-bg,[data-ogsb] .container{background-color:").append(BG).append(" !important;}");
        html.append("[data-ogsb] .stripe-cyan,[data-ogsb] .btn-td{background-color:").append(CYAN).append(" !important;}");
        html.append("[data-ogsb] .stripe-purple{background-color:").append(PURPLE).append(" !important;}");
        html.append("@media only screen and (max-width:620px){.container{width:100% !important;}.px{padding-left:20px !important;padding-right:20px !important;}}");
        html.append("</style></head>");
        html.append("<body class=\"email-bg\" bgcolor=\"").append(BG).append("\" style=\"margin:0;padding:0;background-color:")
                .append(BG).append(";color:").append(TEXT).append(";-webkit-text-size-adjust:100%;\">");
        html.append("<div style=\"display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;color:")
                .append(BG).append(";\">").append(esc(m.preheader()));
        html.append("&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;");
        html.append("</div>");
        html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"email-bg\" bgcolor=\"")
                .append(BG).append("\" style=\"background-color:").append(BG).append(";\"><tr><td align=\"center\" style=\"padding:24px 12px;\">");
        html.append("<table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" class=\"container\" style=\"width:600px;max-width:600px;border:1px solid ")
                .append(LINE).append(";background-color:").append(BG).append(";\" bgcolor=\"").append(BG).append("\">");
        html.append("<tr><td style=\"padding:0;font-size:0;line-height:0;\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr>");
        html.append("<td class=\"stripe-cyan\" width=\"50%\" bgcolor=\"").append(CYAN).append("\" height=\"4\" style=\"width:50%;height:4px;font-size:0;line-height:0;background-color:")
                .append(CYAN).append(";\">&nbsp;</td>");
        html.append("<td class=\"stripe-purple\" width=\"50%\" bgcolor=\"").append(PURPLE).append("\" height=\"4\" style=\"width:50%;height:4px;font-size:0;line-height:0;background-color:")
                .append(PURPLE).append(";\">&nbsp;</td></tr></table></td></tr>");
        html.append("<tr><td class=\"px\" style=\"padding:28px 32px 8px;\"><p style=\"margin:0;font-family:")
                .append(FONT_DISPLAY).append(";font-size:28px;font-weight:900;letter-spacing:2px;line-height:1;\">");
        html.append("<span class=\"text-cyan\" style=\"color:").append(CYAN).append(";\">API</span>");
        html.append("<span class=\"text-primary\" style=\"color:").append(TEXT).append(";\">Arena</span>");
        html.append("</p></td></tr>");
        html.append("<tr><td class=\"px text-primary\" style=\"padding:8px 32px 28px;color:").append(TEXT).append(";\">");
        if (m.kicker() != null && !m.kicker().isBlank()) {
            html.append("<p class=\"text-purple\" style=\"margin:0 0 8px;font-family:").append(FONT_MONO)
                    .append(";font-size:12px;letter-spacing:2px;text-transform:uppercase;color:").append(PURPLE).append(";\">")
                    .append(esc(m.kicker())).append("</p>");
        }
        html.append("<h1 class=\"text-cyan\" style=\"margin:0 0 16px;font-family:").append(FONT_DISPLAY)
                .append(";font-size:28px;font-weight:700;line-height:1.15;letter-spacing:0.4px;color:").append(CYAN).append(";\">")
                .append(esc(m.heading())).append("</h1>");
        html.append(m.bodyHtml());
        if (m.ctaLabel() != null && m.ctaUrl() != null) {
            html.append("<div style=\"margin:8px 0 4px;\">").append(bulletproofButton(m.ctaUrl(), m.ctaLabel())).append("</div>");
        }
        html.append("</td></tr>");
        html.append("<tr><td class=\"px\" style=\"padding:0 32px;\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr><td height=\"1\" bgcolor=\"")
                .append(LINE).append("\" style=\"height:1px;font-size:0;line-height:0;background-color:").append(LINE).append(";\">&nbsp;</td></tr></table></td></tr>");
        html.append("<tr><td class=\"px text-muted\" style=\"padding:16px 32px 28px;color:").append(MUTED).append(";\">");
        html.append("<p class=\"text-muted\" style=\"margin:0 0 12px;font-family:").append(FONT_BODY)
                .append(";font-size:13px;line-height:1.5;color:").append(MUTED).append(";\">").append(reasonHtml).append("</p>");
        if (m.privacyContact()) {
            String privacy = emailProperties.getSupportPrivacyEmail();
            html.append("<p class=\"text-muted\" style=\"margin:0 0 12px;font-family:").append(FONT_BODY)
                    .append(";font-size:13px;line-height:1.5;color:").append(MUTED).append(";\">")
                    .append("<a href=\"mailto:").append(esc(privacy)).append("\" style=\"color:").append(CYAN)
                    .append(";text-decoration:underline;\">").append(esc(privacy)).append("</a></p>");
        }
        html.append(legalLinksHtml(lang));
        html.append("</td></tr></table></td></tr></table></body></html>");

        StringBuilder text = new StringBuilder();
        text.append("API ARENA\n\n");
        if (m.kicker() != null && !m.kicker().isBlank()) {
            text.append(m.kicker()).append("\n\n");
        }
        text.append(m.heading()).append("\n\n");
        text.append(m.bodyText()).append("\n\n");
        if (m.ctaLabel() != null && m.ctaUrl() != null) {
            text.append(m.ctaLabel()).append(": ").append(m.ctaUrl()).append("\n\n");
        }
        text.append(m.reasonText()).append("\n\n");
        if (m.privacyContact()) {
            text.append(emailProperties.getSupportPrivacyEmail()).append("\n\n");
        }
        text.append(legalLinksText(lang));
        return new RenderedEmail(m.subject(), html.toString(), text.toString());
    }

    private String legalLinksHtml(String locale) {
        String[][] links = legalLinks(locale);
        StringBuilder sb = new StringBuilder();
        sb.append("<p style=\"margin:0;font-family:").append(FONT_MONO)
                .append(";font-size:12px;line-height:1.6;color:").append(MUTED).append(";\">");
        for (int i = 0; i < links.length; i++) {
            if (i > 0) {
                sb.append(" <span style=\"color:").append(MUTED).append(";\">&middot;</span> ");
            }
            sb.append(a(links[i][1], links[i][0]));
        }
        sb.append("</p>");
        return sb.toString();
    }

    private String legalLinksText(String locale) {
        StringBuilder sb = new StringBuilder();
        for (String[] link : legalLinks(locale)) {
            sb.append(link[0]).append(": ").append(link[1]).append("\n");
        }
        return sb.toString();
    }

    /** Same labels as the site footer, with the locale prefix the SPA already uses. */
    private String[][] legalLinks(String locale) {
        return new String[][] {
                {"Aviso Legal", frontendLocalePath(locale, "/aviso-legal")},
                {"Privacidad", frontendLocalePath(locale, "/privacidad")},
                {"Cookies", frontendLocalePath(locale, "/cookies")},
                {"Términos", frontendLocalePath(locale, "/terminos")}
        };
    }

    private String bulletproofButton(String href, String label) {
        String safeHref = esc(href);
        String safeLabel = esc(label);
        return "<table role=\"presentation\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0;\">"
                + "<tr><td align=\"center\" bgcolor=\"" + CYAN + "\" class=\"btn-td\" style=\"border-radius:8px;background-color:" + CYAN + ";\">"
                + "<!--[if mso]>"
                + "<v:roundrect xmlns:v=\"urn:schemas-microsoft-com:vml\" xmlns:w=\"urn:schemas-microsoft-com:office:word\" href=\"" + safeHref
                + "\" style=\"height:48px;v-text-anchor:middle;width:280px;\" arcsize=\"12%\" strokecolor=\"" + CYAN + "\" fillcolor=\"" + CYAN + "\">"
                + "<w:anchorlock/>"
                + "<center style=\"color:" + BG + ";font-family:Arial,sans-serif;font-size:16px;font-weight:bold;\">" + safeLabel + "</center>"
                + "</v:roundrect>"
                + "<![endif]-->"
                + "<a href=\"" + safeHref + "\" target=\"_blank\" class=\"btn-a\" style=\"background-color:" + CYAN
                + ";border:1px solid " + CYAN + ";border-radius:8px;color:" + BG
                + ";display:inline-block;font-family:" + FONT_DISPLAY
                + ";font-size:18px;font-weight:700;letter-spacing:0.4px;line-height:48px;text-align:center;text-decoration:none;width:280px;-webkit-text-size-adjust:none;mso-hide:all;\">"
                + safeLabel + "</a></td></tr></table>";
    }

    private void postResend(String toEmail, RenderedEmail email, Map<String, String> extraHeaders) {
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
        body.put("subject", email.subject());
        body.put("html", email.html());
        body.put("text", email.text());
        if (extraHeaders != null && !extraHeaders.isEmpty()) {
            body.put("headers", extraHeaders);
        }

        try {
            restTemplate.postForEntity(RESEND_API, new HttpEntity<>(body, headers), Map.class);
            log.info("Email sent via Resend to {} subject={}", toEmail, email.subject());
        } catch (HttpStatusCodeException e) {
            log.error(
                    "Resend rejected email to {} subject={} status={} body={}",
                    toEmail,
                    email.subject(),
                    e.getStatusCode().value(),
                    e.getResponseBodyAsString());
        } catch (RestClientException e) {
            log.error("Resend request failed for {} subject={}: {}", toEmail, email.subject(), e.getMessage());
        } catch (Exception e) {
            log.error("Failed to send email to {} subject={}: {}", toEmail, email.subject(), e.getMessage());
        }
    }

    /**
     * @param reasonHtml footer markup when the reason contains a link; null uses escaped {@code reasonText}
     * @param reasonText plain-text footer. When {@code reasonHtml} is null this is also the HTML reason.
     */
    private record EmailLayout(
            String subject,
            String locale,
            String preheader,
            String kicker,
            String heading,
            String bodyHtml,
            String bodyText,
            String ctaLabel,
            String ctaUrl,
            String reasonHtml,
            String reasonText,
            boolean privacyContact
    ) {
        private EmailLayout(
                String subject,
                String locale,
                String preheader,
                String kicker,
                String heading,
                String bodyHtml,
                String bodyText,
                String ctaLabel,
                String ctaUrl,
                String reasonText,
                boolean privacyContact
        ) {
            this(subject, locale, preheader, kicker, heading, bodyHtml, bodyText, ctaLabel, ctaUrl, null, reasonText, privacyContact);
        }
    }
}
