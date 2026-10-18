package com.apiarena.authservice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.apiarena.authservice.exception.ApiException;
import com.apiarena.authservice.model.entities.AdminCapability;
import com.apiarena.authservice.model.entities.AdminPermission;
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

/** Guards the "supreme admin" security path: only an admin with every capability may manage admins. */
@ExtendWith(MockitoExtension.class)
class AdminCapabilityTest {

    @Mock UserRepository userRepository;
    @Mock IRefreshTokenService refreshTokenService;
    @Mock IUserService userService;
    @Mock IJwtService jwtService;
    @Mock AdminAuditLogRepository auditRepository;
    @Mock AdminPermissionRepository permissionRepository;
    @Mock ModerationRecordRepository moderationRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock EmailDispatchService emailDispatchService;
    @InjectMocks AdminService service;

    private static User user(Long id, String email, User.Role role) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setRole(role);
        return u;
    }

    private static AdminPermission perm(Long uid, AdminCapability c) {
        return new AdminPermission(uid, c, "seed");
    }

    @Test
    void isSupreme_onlyWithEveryCapability() {
        when(permissionRepository.findByAdminUserId(1L))
                .thenReturn(List.of(
                        perm(1L, AdminCapability.MODERATION),
                        perm(1L, AdminCapability.BI),
                        perm(1L, AdminCapability.CONTENT)));
        when(permissionRepository.findByAdminUserId(2L))
                .thenReturn(List.of(perm(2L, AdminCapability.MODERATION), perm(2L, AdminCapability.BI)));

        assertTrue(service.isSupreme(1L));
        assertFalse(service.isSupreme(2L));
    }

    @Test
    void setRoleToAdmin_deniedForNonSupreme() {
        User acting = user(2L, "mod@x", User.Role.ADMIN);
        User target = user(3L, "stu@x", User.Role.STUDENT);
        when(userRepository.findById(3L)).thenReturn(Optional.of(target));
        when(userRepository.findByEmailIgnoreCase("mod@x")).thenReturn(Optional.of(acting));
        when(permissionRepository.findByAdminUserId(2L)) // acting has only MODERATION → not supreme
                .thenReturn(List.of(perm(2L, AdminCapability.MODERATION)));

        ApiException ex = assertThrows(ApiException.class,
                () -> service.setRole(3L, User.Role.ADMIN, List.of(AdminCapability.BI), "mod@x"));
        assertEquals("ADMIN_NOT_SUPREME", ex.getCode());
        verify(userRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void setRoleToAdmin_bySupreme_syncsCapabilities() {
        User acting = user(1L, "boss@x", User.Role.ADMIN);
        User target = user(3L, "stu@x", User.Role.STUDENT);
        when(userRepository.findById(3L)).thenReturn(Optional.of(target));
        when(userRepository.findByEmailIgnoreCase("boss@x")).thenReturn(Optional.of(acting));
        when(permissionRepository.findByAdminUserId(1L)) // acting is supreme
                .thenReturn(List.of(
                        perm(1L, AdminCapability.MODERATION),
                        perm(1L, AdminCapability.BI),
                        perm(1L, AdminCapability.CONTENT)));
        when(permissionRepository.findByAdminUserId(3L)).thenReturn(List.of()); // target starts with none

        service.setRole(3L, User.Role.ADMIN, List.of(AdminCapability.BI), "boss@x");

        assertEquals(User.Role.ADMIN, target.getRole());
        verify(permissionRepository).save(any(AdminPermission.class)); // BI granted to reach desired set
    }

    @Test
    void writeContent_withoutContent_isForbidden() {
        User acting = user(2L, "ops@x", User.Role.ADMIN);
        when(userRepository.findByEmailIgnoreCase("ops@x")).thenReturn(Optional.of(acting));
        when(permissionRepository.existsByAdminUserIdAndCapability(2L, AdminCapability.CONTENT))
                .thenReturn(false);

        ApiException ex = assertThrows(ApiException.class, () -> service.writeContent("ops@x"));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("ADMIN_MISSING_CAPABILITY", ex.getCode());
    }

    @Test
    void writeContent_withContent_isAllowed() {
        User acting = user(1L, "boss@x", User.Role.ADMIN);
        when(userRepository.findByEmailIgnoreCase("boss@x")).thenReturn(Optional.of(acting));
        when(permissionRepository.existsByAdminUserIdAndCapability(1L, AdminCapability.CONTENT))
                .thenReturn(true);

        service.writeContent("boss@x");
    }

    @Test
    void formerSupreme_countsAsSupremeAfterContentBackfill() {
        List<AdminCapability> before = List.of(AdminCapability.MODERATION, AdminCapability.BI);
        assertFalse(before.size() == AdminCapability.values().length);

        List<AdminCapability> after = new ArrayList<>(before);
        if (contentBackfillApplies(before)) {
            after.add(AdminCapability.CONTENT);
        }

        when(permissionRepository.findByAdminUserId(1L))
                .thenReturn(after.stream().map(c -> perm(1L, c)).toList());

        assertTrue(service.isSupreme(1L));
        assertEquals(AdminCapability.values().length, after.size());
    }

    @Test
    void contentBackfill_doesNotPromotePartialAdmin() {
        List<AdminCapability> before = List.of(AdminCapability.MODERATION);
        List<AdminCapability> after = new ArrayList<>(before);
        if (contentBackfillApplies(before)) {
            after.add(AdminCapability.CONTENT);
        }

        when(permissionRepository.findByAdminUserId(2L))
                .thenReturn(after.stream().map(c -> perm(2L, c)).toList());

        assertFalse(after.contains(AdminCapability.CONTENT));
        assertFalse(service.isSupreme(2L));
    }

    @Test
    void contentBackfillSql_matchesInitAndCreateScripts() throws Exception {
        String alter = backfillBlock("docker/postgres/alter-admin-capability-content.sql");
        assertEquals(alter, backfillBlock("docker/postgres/create-admin-permissions.sql"));
        assertEquals(alter, backfillBlock("docker/postgres/init-db.sql"));
        assertTrue(alter.contains("'CONTENT'"));
        assertTrue(alter.contains("capability = 'BI'"));
        assertTrue(alter.contains("capability = 'MODERATION'"));
        assertTrue(alter.contains("ON CONFLICT (admin_user_id, capability) DO NOTHING"));

        String rollback = Files.readString(repoFile("docker/postgres/rollback-admin-capability-content.sql"));
        assertTrue(rollback.contains("DELETE FROM admin_permissions"));
        assertTrue(rollback.contains("WHERE capability = 'CONTENT'"));
        assertFalse(rollback.contains("DROP TABLE"));
    }

    /** Same predicate as the SQL backfill: CONTENT only when both domains are already held. */
    private static boolean contentBackfillApplies(List<AdminCapability> held) {
        return held.contains(AdminCapability.MODERATION) && held.contains(AdminCapability.BI);
    }

    private static String backfillBlock(String relative) throws Exception {
        String sql = Files.readString(repoFile(relative));
        int start = sql.indexOf("-- content-backfill:");
        if (start < 0) {
            fail("missing content backfill in " + relative);
        }
        int end = sql.indexOf("DO NOTHING;", start);
        if (end < 0) {
            fail("missing content backfill in " + relative);
        }
        return sql.substring(start, end + "DO NOTHING;".length()).replaceAll("\\s+", " ").trim();
    }

    private static Path repoFile(String relative) {
        Path dir = Path.of("").toAbsolutePath();
        for (int i = 0; i < 6 && dir != null; i++) {
            Path candidate = dir.resolve(relative);
            if (Files.isRegularFile(candidate)) {
                return candidate;
            }
            dir = dir.getParent();
        }
        throw new IllegalStateException("missing " + relative);
    }
}
