package com.apiarena.authservice.model.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpEntity;
import org.springframework.web.client.RestTemplate;

import com.apiarena.authservice.config.EmailProperties;
import com.apiarena.authservice.model.services.EmailDispatchService.RenderedEmail;

/**
 * Renders every transactional email in EN and ES (reminder and notification mirror are English-only on main)
 * and checks the shared layout: CTA, links, no leftover placeholders, and a plain-text alternative.
 */
class EmailDispatchServiceTest {

    private static final String BASE = "https://apiarena.net";

    private EmailProperties props;
    private RestTemplate restTemplate;
    private EmailDispatchService service;

    @BeforeEach
    void setUp() {
        props = new EmailProperties();
        props.setFrontendBaseUrl(BASE);
        props.setSupportPrivacyEmail("privacy@apiarena.net");
        props.setFrom("API Arena <noreply@apiarena.net>");
        restTemplate = mock(RestTemplate.class);
        service = new EmailDispatchService(props, restTemplate);
    }

    @ParameterizedTest
    @ValueSource(strings = {"en", "es"})
    void verification(String locale) {
        RenderedEmail email = service.composeVerificationEmail("arclight", "tok-" + locale, locale);
        boolean es = "es".equals(locale);
        assertEquals(es ? "Verifica tu email de API Arena" : "Verify your API Arena email", email.subject());
        String link = BASE + "/" + locale + "/verify-email?token=tok-" + locale;
        assertLayout(email, locale, es ? "Verificar email" : "Verify email", link);
        assertTrue(email.html().contains(es ? "Confirma tu cuenta de API Arena" : "Confirm your API Arena account"));
        assertTrue(email.text().contains(es
                ? "Si no creaste una cuenta, puedes ignorar este mensaje."
                : "If you did not create an account, you can ignore this message."));
    }

    @Test
    void verificationEscapesUsername() {
        RenderedEmail email = service.composeVerificationEmail("<script>", "tok", "en");
        assertFalse(email.html().contains("<script>"));
        assertTrue(email.html().contains("&lt;script&gt;"));
        assertTrue(email.text().contains("<script>"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"en", "es"})
    void passwordReset(String locale) {
        RenderedEmail email = service.composePasswordResetEmail("arclight", "reset-" + locale, locale);
        boolean es = "es".equals(locale);
        assertEquals(es ? "Restablece tu contraseña de API Arena" : "Reset your API Arena password", email.subject());
        String link = BASE + "/" + locale + "/reset-password?token=reset-" + locale;
        assertLayout(email, locale, es ? "Restablecer" : "Reset password", link);
        assertTrue(email.text().contains(es ? "caduca en 1 hora" : "expires in 1 hour"));
        assertTrue(email.html().contains(link));
    }

    @Test
    void passwordReminderStaysEnglishAndUnscoped() {
        RenderedEmail email = service.composePasswordRotationReminderEmail("arclight");
        String link = BASE + "/forgot-password";
        assertEquals("API Arena — password security reminder", email.subject());
        assertLayout(email, "en", "Change my password", link);
        assertFalse(email.html().contains("/en/forgot-password"));
        assertTrue(email.html().contains("every four months"));
        assertTrue(email.text().contains("about every four months"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"en", "es"})
    void accountDeletion(String locale) {
        RenderedEmail email = service.composeAccountDeletionEmail(
                "arclight", LocalDateTime.of(2026, 11, 1, 15, 0), locale);
        boolean es = "es".equals(locale);
        assertEquals(es ? "API Arena — tu cuenta ha sido eliminada" : "API Arena — your account has been deleted", email.subject());
        assertLayout(email, locale, null, null);
        assertTrue(email.html().contains("mailto:privacy@apiarena.net"));
        assertTrue(email.html().contains("2026-11-01"));
        assertTrue(email.text().contains("privacy@apiarena.net"));
        assertTrue(email.text().contains("2026-11-01"));
        assertFalse(email.html().contains("class=\"btn-a\""));
        assertTrue(email.html().contains(es ? "irreversible" : "irreversible"));
        assertTrue(email.text().contains(es ? "almacén aparte" : "separate store"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"en", "es"})
    void welcome(String locale) {
        RenderedEmail email = service.composeWelcomeBetaLegacyEmail("arclight", locale);
        boolean es = "es".equals(locale);
        assertEquals(es ? "Bienvenido a API Arena (beta)" : "Welcome to API Arena (beta)", email.subject());
        assertLayout(email, locale, null, null);
        assertFalse(email.html().contains("class=\"btn-a\""));
        assertTrue(email.html().contains(es ? "fase temprana" : "early supporter"));
        assertTrue(email.text().contains(es ? "El equipo de API Arena" : "The API Arena team"));
        assertTrue(email.text().contains(es
                ? "Recibes este email porque verificaste tu cuenta de API Arena."
                : "You received this email because you verified your API Arena account."));
    }

    @ParameterizedTest
    @ValueSource(strings = {"en", "es"})
    void firstSteps(String locale) {
        RenderedEmail email = service.composeFirstStepsBetaEmail("arclight", locale);
        boolean es = "es".equals(locale);
        assertEquals(es ? "Tus primeros pasos en API Arena (beta)" : "Your first steps in API Arena (beta)", email.subject());
        String login = BASE + "/" + locale + "/login";
        assertLayout(email, locale, es ? "Inicia" : "Sign in", login);
        for (String path : new String[] {"/challenges", "/dashboard", "/submissions", "/leaderboard", "/notifications", "/friends"}) {
            assertTrue(email.html().contains(BASE + "/" + locale + path), path);
            assertTrue(email.text().contains(BASE + "/" + locale + path), path);
        }
        assertTrue(email.text().contains(es ? "pipeline sandbox" : "From a challenge page, use Submit."));
    }

    @ParameterizedTest
    @ValueSource(strings = {"en", "es"})
    void newChallenge(String locale) {
        RenderedEmail email = service.composeNewChallengePublishedEmail("arclight", "Event-Sourced Banking Ledger", 42, locale);
        boolean es = "es".equals(locale);
        assertEquals(es
                ? "[API Arena] Nuevo challenge: Event-Sourced Banking Ledger"
                : "[API Arena] New challenge: Event-Sourced Banking Ledger", email.subject());
        String link = BASE + "/" + locale + "/challenges/42";
        assertLayout(email, locale, es ? "Abrir challenge" : "Open challenge", link);
        assertTrue(email.html().contains(BASE + "/" + locale + "/challenges\""));
        assertTrue(email.text().contains(es ? "Gestionar alertas" : "Unsubscribe / manage alerts"));
        assertTrue(email.html().contains("Event-Sourced Banking Ledger"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"en", "es"})
    void adminPasswordChanged(String locale) {
        RenderedEmail email = service.composeAdminPasswordChangedEmail("arclight", locale);
        boolean es = "es".equals(locale);
        assertEquals(es
                ? "API Arena — un administrador ha cambiado tu contraseña"
                : "API Arena — an administrator changed your password", email.subject());
        String login = BASE + "/" + locale + "/login";
        assertLayout(email, locale, es ? "Iniciar" : "Sign in", login);
        assertTrue(email.html().contains("mailto:privacy@apiarena.net"));
        assertFalse(email.html().contains("password is"));
        assertTrue(email.text().contains(es
                ? "ha cerrado todas tus sesiones"
                : "signed you out of every session"));
        assertTrue(email.text().contains(es
                ? "contacta con soporte de inmediato"
                : "contact support right away"));
    }

    @Test
    void notificationMirrorStaysEnglish() {
        RenderedEmail email = service.composeNotificationAlertEmail(
                "arclight", "Score posted", "Your run finished.\nScore: 800", "important");
        assertEquals("[API Arena] [IMPORTANT] Score posted", email.subject());
        assertLayout(email, "en", null, null);
        assertFalse(email.html().contains("class=\"btn-a\""));
        assertTrue(email.html().contains("IMPORTANT"));
        assertTrue(email.html().contains("Score posted"));
        assertTrue(email.html().contains("Your run finished.<br>Score: 800"));
        assertTrue(email.text().contains("Your run finished.\nScore: 800"));
        assertTrue(email.text().contains("This email mirrors your in-app notification (bell in the top bar)."));
    }

    @Test
    void resendPayloadIncludesPlainTextAndSkipsWithoutKey() {
        service.sendVerificationEmail("a@b.c", "arclight", "tok", "en");
        verify(restTemplate, never()).postForEntity(anyString(), any(), any());

        props.setResendApiKey("re_test_key");
        when(restTemplate.postForEntity(eq("https://api.resend.com/emails"), any(), eq(Map.class))).thenReturn(null);
        service.sendVerificationEmail("a@b.c", "arclight", "tok", "es");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<HttpEntity<Map<String, Object>>> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(eq("https://api.resend.com/emails"), captor.capture(), eq(Map.class));
        Map<String, Object> body = captor.getValue().getBody();
        String html = (String) body.get("html");
        String text = (String) body.get("text");
        assertEquals("Verifica tu email de API Arena", body.get("subject"));
        assertTrue(html.contains(BASE + "/es/verify-email?token=tok"));
        assertTrue(text.contains(BASE + "/es/verify-email?token=tok"));
        assertFalse(text.isBlank());
    }

    @Test
    void newChallengeKeepsUnsubscribeHeaders() {
        props.setResendApiKey("re_test_key");
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class))).thenReturn(null);
        service.sendNewChallengePublishedEmail("a@b.c", "arclight", "Ledger", 7, "es");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<HttpEntity<Map<String, Object>>> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(eq("https://api.resend.com/emails"), captor.capture(), eq(Map.class));
        @SuppressWarnings("unchecked")
        Map<String, String> headers = (Map<String, String>) captor.getValue().getBody().get("headers");
        assertEquals("List-Unsubscribe=One-Click", headers.get("List-Unsubscribe-Post"));
        assertTrue(headers.get("List-Unsubscribe").contains("mailto:privacy@apiarena.net?subject=unsubscribe"));
        assertTrue(headers.get("List-Unsubscribe").contains(BASE + "/es/challenges"));
    }

    @Test
    void writesEnglishPreviews() throws Exception {
        Path dir = repoRoot().resolve("docs/email-previews");
        Files.createDirectories(dir);
        write(dir, "verification.html", service.composeVerificationEmail("arclight", "preview-token", "en"));
        write(dir, "password-reset.html", service.composePasswordResetEmail("arclight", "preview-token", "en"));
        write(dir, "password-reminder.html", service.composePasswordRotationReminderEmail("arclight"));
        write(dir, "account-deletion.html", service.composeAccountDeletionEmail(
                "arclight", LocalDateTime.of(2026, 11, 1, 15, 0), "en"));
        write(dir, "welcome-beta.html", service.composeWelcomeBetaLegacyEmail("arclight", "en"));
        write(dir, "first-steps.html", service.composeFirstStepsBetaEmail("arclight", "en"));
        write(dir, "new-challenge.html", service.composeNewChallengePublishedEmail(
                "arclight", "Event-Sourced Banking Ledger", 42, "en"));
        write(dir, "notification-mirror.html", service.composeNotificationAlertEmail(
                "arclight", "Score posted", "Your run finished.", "IMPORTANT"));
        write(dir, "admin-password-changed.html", service.composeAdminPasswordChangedEmail("arclight", "en"));
        assertTrue(Files.readString(dir.resolve("verification.html")).contains("Verify email"));
        assertTrue(Files.readString(dir.resolve("password-reminder.html")).contains("every four months"));
    }

    private static void write(Path dir, String name, RenderedEmail email) throws Exception {
        Files.writeString(dir.resolve(name), email.html());
    }

    private static Path repoRoot() {
        Path dir = Path.of(System.getProperty("user.dir")).toAbsolutePath();
        for (int i = 0; i < 6 && dir != null; i++) {
            if (Files.exists(dir.resolve("docker-compose.yml"))) {
                return dir;
            }
            dir = dir.getParent();
        }
        throw new IllegalStateException("repo root not found from " + System.getProperty("user.dir"));
    }

    private static void assertLayout(RenderedEmail email, String locale, String ctaLabel, String link) {
        assertFalse(email.text() == null || email.text().isBlank(), "plain text missing");
        assertTrue(email.html().contains("max-width:600px"));
        assertTrue(email.html().contains("Barlow Condensed"));
        assertTrue(email.html().contains("Syne"));
        assertTrue(email.html().contains("Share Tech Mono"));
        assertTrue(email.html().contains(">API</span>"));
        assertTrue(email.html().contains(">Arena</span>"));
        assertTrue(email.html().contains("#0A0E27"));
        assertTrue(email.html().contains("#00D9FF"));
        assertTrue(email.html().contains("#B24BF3"));
        assertTrue(email.html().contains(BASE + "/" + locale + "/aviso-legal"));
        assertTrue(email.html().contains(BASE + "/" + locale + "/privacidad"));
        assertTrue(email.html().contains(BASE + "/" + locale + "/cookies"));
        assertTrue(email.html().contains(BASE + "/" + locale + "/terminos"));
        assertTrue(email.text().contains(BASE + "/" + locale + "/privacidad"));
        assertTrue(email.html().contains("Developed by <a href=\"#\""));
        assertTrue(email.html().contains(">Gubia</a>"));
        assertTrue(email.text().contains("Developed by Gubia"));
        assertFalse(email.html().contains("%s"), "unreplaced %s in html");
        assertFalse(email.text().contains("%s"), "unreplaced %s in text");
        assertFalse(email.html().contains("{{"), email.html());
        assertFalse(email.html().contains("@@"));
        assertFalse(email.text().contains("{{"));
        if (ctaLabel != null) {
            assertTrue(email.html().contains(ctaLabel), ctaLabel);
            assertTrue(email.text().contains(ctaLabel), ctaLabel);
        }
        if (link != null) {
            assertTrue(email.html().contains(link), link);
            assertTrue(email.text().contains(link), link);
            assertTrue(email.html().contains("class=\"btn-a\""), "bulletproof button");
        }
    }
}
