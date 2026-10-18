package com.apiarena.authservice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.apiarena.authservice.exception.ApiException;
import com.apiarena.authservice.model.dto.AdminSetPasswordRequest;
import com.apiarena.authservice.model.entities.AdminAuditLog;
import com.apiarena.authservice.model.entities.AdminCapability;
import com.apiarena.authservice.model.entities.AdminPermission;
import com.apiarena.authservice.model.entities.RefreshToken;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.model.services.AdminService;
import com.apiarena.authservice.model.services.EmailDispatchService;
import com.apiarena.authservice.model.services.IJwtService;
import com.apiarena.authservice.model.services.IRefreshTokenService;
import com.apiarena.authservice.model.services.IUserService;
import com.apiarena.authservice.repository.AdminAuditLogRepository;
import com.apiarena.authservice.repository.AdminPermissionRepository;
import com.apiarena.authservice.repository.ModerationRecordRepository;
import com.apiarena.authservice.repository.UserRepository;

/** Admin force-reset and set-password: capability, supreme, session revoke, audit redaction. */
@ExtendWith(MockitoExtension.class)
class AdminPasswordActionTest {

    private static final String RAW_PASSWORD = "Zz9-admin-set-secret";
    private static final String OLD_REFRESH = "old-refresh-token";

    @Mock UserRepository userRepository;
    @Mock IUserService userService;
    @Mock IJwtService jwtService;
    @Mock AdminAuditLogRepository auditRepository;
    @Mock AdminPermissionRepository permissionRepository;
    @Mock ModerationRecordRepository moderationRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock EmailDispatchService emailDispatchService;
    @Mock com.apiarena.authservice.model.services.TwoFactorMethodService twoFactorMethodService;

    private RevokingRefreshTokens refreshTokens;
    private AdminService service;

    @BeforeEach
    void setUp() {
        refreshTokens = new RevokingRefreshTokens();
        service = new AdminService(
                userRepository,
                refreshTokens,
                userService,
                jwtService,
                auditRepository,
                permissionRepository,
                moderationRepository,
                passwordEncoder,
                emailDispatchService,
                twoFactorMethodService);
    }

    @Test
    void forcePasswordReset_withoutModeration_isForbidden() {
        User acting = user(2L, "mod@x", User.Role.ADMIN);
        User target = student();
        when(userRepository.findById(3L)).thenReturn(Optional.of(target));
        stubActor(acting, false);
        refreshTokens.issue(target.getId(), OLD_REFRESH);

        ApiException ex = assertThrows(ApiException.class,
                () -> service.forcePasswordReset(3L, acting.getEmail()));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("ADMIN_MISSING_CAPABILITY", ex.getCode());
        assertNotNull(refreshTokens.verifyRefreshToken(OLD_REFRESH));
        verify(auditRepository, never()).save(any());
        verify(emailDispatchService, never()).sendPasswordResetEmail(any(), any(), any(), any());
    }

    @Test
    void setPassword_withoutModeration_isForbidden() {
        User acting = user(2L, "mod@x", User.Role.ADMIN);
        User target = student();
        when(userRepository.findById(3L)).thenReturn(Optional.of(target));
        stubActor(acting, false);

        ApiException ex = assertThrows(ApiException.class,
                () -> service.setPassword(3L, RAW_PASSWORD, acting.getEmail()));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("ADMIN_MISSING_CAPABILITY", ex.getCode());
        verify(passwordEncoder, never()).encode(any());
        verify(auditRepository, never()).save(any());
    }

    @Test
    void forcePasswordReset_nonSupremeOnAdmin_isForbidden() {
        User acting = user(2L, "mod@x", User.Role.ADMIN);
        User target = user(4L, "boss@x", User.Role.ADMIN);
        when(userRepository.findById(4L)).thenReturn(Optional.of(target));
        stubActor(acting, true);
        stubCaps(acting, AdminCapability.MODERATION);

        ApiException ex = assertThrows(ApiException.class,
                () -> service.forcePasswordReset(4L, acting.getEmail()));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("ADMIN_NOT_SUPREME", ex.getCode());
        verify(userRepository, never()).save(any());
        verify(auditRepository, never()).save(any());
    }

    @Test
    void setPassword_nonSupremeOnAdmin_isForbidden() {
        User acting = user(2L, "mod@x", User.Role.ADMIN);
        User target = user(4L, "boss@x", User.Role.ADMIN);
        when(userRepository.findById(4L)).thenReturn(Optional.of(target));
        stubActor(acting, true);
        stubCaps(acting, AdminCapability.MODERATION);

        ApiException ex = assertThrows(ApiException.class,
                () -> service.setPassword(4L, RAW_PASSWORD, acting.getEmail()));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("ADMIN_NOT_SUPREME", ex.getCode());
        verify(passwordEncoder, never()).encode(any());
        verify(auditRepository, never()).save(any());
    }

    @Test
    void setPassword_revokesOldRefreshToken_andAuditOmitsPassword() {
        User acting = user(2L, "mod@x", User.Role.ADMIN);
        User target = student();
        target.setPasswordHash("old-hash");
        target.setPasswordResetToken("pending-reset");
        target.setLastPasswordReminderSentAt(LocalDateTime.now().minusDays(3));
        when(userRepository.findById(3L)).thenReturn(Optional.of(target));
        stubActor(acting, true);
        when(passwordEncoder.encode(RAW_PASSWORD)).thenReturn("encoded-hash");
        refreshTokens.issue(target.getId(), OLD_REFRESH);

        service.setPassword(3L, RAW_PASSWORD, acting.getEmail());

        assertEquals("encoded-hash", target.getPasswordHash());
        assertFalse(target.getPasswordHash().contains(RAW_PASSWORD));
        assertNull(target.getPasswordResetToken());
        assertNull(target.getLastPasswordReminderSentAt());
        assertNotNull(target.getPasswordChangedAt());
        assertThrows(SecurityException.class, () -> refreshTokens.verifyRefreshToken(OLD_REFRESH));
        verify(emailDispatchService).sendAdminPasswordChangedEmail("stu@x", "stu", "es");

        AdminAuditLog row = capturedAudit();
        assertEquals("SET_PASSWORD", row.getAction());
        assertEquals("mod@x", row.getActorEmail());
        assertEquals(3L, row.getTargetUserId());
        assertEquals("stu", row.getTargetUsername());
        assertNull(row.getDetail());
        assertFalse(auditText(row).contains(RAW_PASSWORD));
    }

    @Test
    void forcePasswordReset_revokesOldRefreshToken_andAuditOmitsToken() {
        User acting = user(2L, "mod@x", User.Role.ADMIN);
        User target = student();
        target.setPasswordHash("old-hash");
        target.setLastPasswordReminderSentAt(LocalDateTime.now().minusDays(3));
        when(userRepository.findById(3L)).thenReturn(Optional.of(target));
        stubActor(acting, true);
        refreshTokens.issue(target.getId(), OLD_REFRESH);

        service.forcePasswordReset(3L, acting.getEmail());

        assertEquals("old-hash", target.getPasswordHash());
        assertNotNull(target.getPasswordResetToken());
        assertEquals(64, target.getPasswordResetToken().length());
        assertTrue(target.getPasswordResetExpiresAt().isAfter(LocalDateTime.now().plusMinutes(50)));
        assertTrue(target.getPasswordResetExpiresAt().isBefore(LocalDateTime.now().plusMinutes(70)));
        assertNull(target.getLastPasswordReminderSentAt());
        assertNotNull(target.getPasswordChangedAt());
        assertThrows(SecurityException.class, () -> refreshTokens.verifyRefreshToken(OLD_REFRESH));
        verify(emailDispatchService).sendPasswordResetEmail(
                "stu@x", "stu", target.getPasswordResetToken(), "es");

        AdminAuditLog row = capturedAudit();
        assertEquals("FORCE_PASSWORD_RESET", row.getAction());
        assertNull(row.getDetail());
        assertFalse(auditText(row).contains(target.getPasswordResetToken()));
        assertFalse(auditText(row).contains(RAW_PASSWORD));
    }

    @Test
    void setPassword_rejectsShortPasswordWithSameRuleAsRegistration() {
        User acting = user(2L, "mod@x", User.Role.ADMIN);
        User target = student();
        when(userRepository.findById(3L)).thenReturn(Optional.of(target));
        stubActor(acting, true);

        ApiException ex = assertThrows(ApiException.class,
                () -> service.setPassword(3L, "short", acting.getEmail()));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("AUTH_PASSWORD_TOO_SHORT", ex.getCode());
        assertEquals("Password must be at least 6 characters", ex.getMessage());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void setPassword_cannotTargetSelf() {
        User acting = user(2L, "mod@x", User.Role.ADMIN);
        acting.setUsername("mod");
        when(userRepository.findById(2L)).thenReturn(Optional.of(acting));
        stubActor(acting, true);

        ApiException ex = assertThrows(ApiException.class,
                () -> service.setPassword(2L, RAW_PASSWORD, acting.getEmail()));

        assertEquals("ADMIN_SELF_ACTION", ex.getCode());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void requestToString_redactsPassword() {
        AdminSetPasswordRequest request = new AdminSetPasswordRequest();
        request.setNewPassword(RAW_PASSWORD);
        assertFalse(request.toString().contains(RAW_PASSWORD));
    }

    private void stubActor(User acting, boolean moderation) {
        when(userRepository.findByEmailIgnoreCase(acting.getEmail())).thenReturn(Optional.of(acting));
        when(permissionRepository.existsByAdminUserIdAndCapability(acting.getId(), AdminCapability.MODERATION))
                .thenReturn(moderation);
    }

    private void stubCaps(User acting, AdminCapability... caps) {
        when(permissionRepository.findByAdminUserId(acting.getId())).thenReturn(
                java.util.Arrays.stream(caps).map(c -> new AdminPermission(acting.getId(), c, "seed")).toList());
    }

    private AdminAuditLog capturedAudit() {
        ArgumentCaptor<AdminAuditLog> cap = ArgumentCaptor.forClass(AdminAuditLog.class);
        verify(auditRepository).save(cap.capture());
        return cap.getValue();
    }

    private static String auditText(AdminAuditLog row) {
        return String.valueOf(row.getActorEmail())
                + String.valueOf(row.getAction())
                + String.valueOf(row.getTargetUserId())
                + String.valueOf(row.getTargetUsername())
                + String.valueOf(row.getDetail());
    }

    private static User student() {
        User target = user(3L, "stu@x", User.Role.STUDENT);
        target.setUsername("stu");
        target.setPreferredLocale("es");
        return target;
    }

    private static User user(Long id, String email, User.Role role) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setRole(role);
        return u;
    }

    /** Deletes the user's live refresh tokens, matching {@code RefreshTokenService#revokeAllUserTokens}. */
    private static final class RevokingRefreshTokens implements IRefreshTokenService {
        private final Map<Long, Set<String>> live = new HashMap<>();

        void issue(Long userId, String raw) {
            live.computeIfAbsent(userId, id -> new java.util.HashSet<>()).add(raw);
        }

        @Override
        public RefreshToken createRefreshToken(User user) {
            throw new UnsupportedOperationException();
        }

        @Override
        public RefreshToken verifyRefreshToken(String token) {
            boolean found = live.values().stream().anyMatch(tokens -> tokens.contains(token));
            if (!found) {
                throw new SecurityException("Invalid refresh token");
            }
            return new RefreshToken();
        }

        @Override
        public void revokeRefreshToken(String token) {
            throw new UnsupportedOperationException();
        }

        @Override
        public void revokeAllUserTokens(User user) {
            live.remove(user.getId());
        }
    }
}
