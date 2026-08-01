package com.apiarena.authservice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.apiarena.authservice.exception.ApiException;
import com.apiarena.authservice.model.entities.AdminCapability;
import com.apiarena.authservice.model.entities.AdminPermission;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.model.services.AdminService;
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
                .thenReturn(List.of(perm(1L, AdminCapability.MODERATION), perm(1L, AdminCapability.BI)));
        when(permissionRepository.findByAdminUserId(2L))
                .thenReturn(List.of(perm(2L, AdminCapability.MODERATION)));

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
                .thenReturn(List.of(perm(1L, AdminCapability.MODERATION), perm(1L, AdminCapability.BI)));
        when(permissionRepository.findByAdminUserId(3L)).thenReturn(List.of()); // target starts with none

        service.setRole(3L, User.Role.ADMIN, List.of(AdminCapability.BI), "boss@x");

        assertEquals(User.Role.ADMIN, target.getRole());
        verify(permissionRepository).save(any(AdminPermission.class)); // BI granted to reach desired set
    }
}
