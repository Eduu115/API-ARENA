package com.apiarena.authservice.model.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.apiarena.authservice.config.TwoFactorProperties;
import com.apiarena.authservice.exception.ApiException;
import com.apiarena.authservice.model.entities.TwoFactorMethodKind;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.model.entities.UserTwoFactorMethod;
import com.apiarena.authservice.repository.UserRepository;
import com.apiarena.authservice.repository.UserTwoFactorMethodRepository;

class TwoFactorMethodServiceTest {

    private final List<UserTwoFactorMethod> rows = new ArrayList<>();
    private final AtomicLong ids = new AtomicLong();

    private TwoFactorProperties properties;
    private TwoFactorMethodService service;

    @BeforeEach
    void setUp() {
        UserTwoFactorMethodRepository methods = mock(UserTwoFactorMethodRepository.class);
        UserRepository users = mock(UserRepository.class);
        properties = new TwoFactorProperties();
        when(users.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(methods.save(any())).thenAnswer(invocation -> store(invocation.getArgument(0)));
        when(methods.saveAndFlush(any())).thenAnswer(invocation -> store(invocation.getArgument(0)));
        when(methods.findByUserId(any())).thenAnswer(invocation -> rows.stream()
                .filter(row -> invocation.getArgument(0).equals(row.getUserId()))
                .toList());
        when(methods.findByUserIdAndMethod(any(), any())).thenAnswer(invocation -> rows.stream()
                .filter(row -> invocation.getArgument(0).equals(row.getUserId())
                        && invocation.getArgument(1) == row.getMethod())
                .findFirst());
        when(methods.existsByUserIdAndEnabledTrue(any())).thenAnswer(invocation -> rows.stream()
                .anyMatch(row -> invocation.getArgument(0).equals(row.getUserId()) && row.isEnabled()));
        service = new TwoFactorMethodService(methods, users, properties);
    }

    @Test
    void hasAnyTwoFactorEnabledReadsLegacyFlagAndEmailRows() {
        User legacy = student(1L);
        legacy.setTotpEnabled(true);
        assertTrue(service.hasAnyTwoFactorEnabled(legacy));

        User emailOnly = student(2L);
        emailOnly.setTotpEnabled(false);
        assertFalse(service.hasAnyTwoFactorEnabled(emailOnly));
        emailOnly.setEmailVerified(true);
        service.markEmailEnabled(emailOnly);
        assertTrue(service.hasAnyTwoFactorEnabled(emailOnly));
    }

    @Test
    void enablingTotpDualWritesTheLegacyColumnAndAPrimaryRow() {
        User user = student(3L);
        user.setTotpSecret("SECRET");
        service.markTotpEnabled(user);
        assertTrue(user.getTotpEnabled());
        UserTwoFactorMethod row = rows.get(0);
        assertEquals(TwoFactorMethodKind.TOTP, row.getMethod());
        assertTrue(row.isEnabled());
        assertTrue(row.isPrimary());
    }

    @Test
    void adminCannotDisableTotpAndEmailStaysSecondary() {
        User admin = new User("sysop", "sysop@apiarena.dev", "x", User.Role.ADMIN);
        admin.setId(4L);
        admin.setEmailVerified(true);
        admin.setTotpEnabled(true);
        service.markTotpEnabled(admin);

        ApiException blocked = assertThrows(ApiException.class, () -> service.markTotpDisabled(admin));
        assertEquals("AUTH_2FA_ADMIN_REQUIRED", blocked.getCode());

        ApiException flagOff = assertThrows(ApiException.class, () -> service.markEmailEnabled(admin));
        assertEquals("AUTH_2FA_EMAIL_NOT_ALLOWED", flagOff.getCode());

        properties.setAdminAllowEmail(true);
        service.markEmailEnabled(admin);
        UserTwoFactorMethod email = rows.stream()
                .filter(row -> row.getMethod() == TwoFactorMethodKind.EMAIL)
                .findFirst()
                .orElseThrow();
        assertTrue(email.isEnabled());
        assertFalse(email.isPrimary());
        TwoFactorMethodService.TwoFactorLoginView view = service.loginView(admin);
        assertEquals("TOTP", view.primaryMethod());
        assertTrue(view.emailAllowed());
        assertTrue(view.methods().contains("EMAIL"));

        properties.setAdminAllowEmail(false);
        TwoFactorMethodService.TwoFactorLoginView hidden = service.loginView(admin);
        assertFalse(hidden.emailAllowed());
        assertFalse(hidden.methods().contains("EMAIL"));
        assertEquals("TOTP", hidden.primaryMethod());
    }

    @Test
    void studentEmailCanBeThePrimaryMethod() {
        User user = student(5L);
        user.setEmailVerified(true);
        service.markEmailEnabled(user);
        TwoFactorMethodService.TwoFactorLoginView view = service.loginView(user);
        assertEquals("EMAIL", view.primaryMethod());
        assertTrue(view.emailAllowed());
        assertFalse(view.totpEnrolled());
        assertEquals(List.of("EMAIL"), view.methods());
    }

    private User student(long id) {
        User user = new User("arclight", "arclight@apiarena.dev", "x", User.Role.STUDENT);
        user.setId(id);
        user.setEmailVerified(true);
        return user;
    }

    private UserTwoFactorMethod store(UserTwoFactorMethod row) {
        if (row.getId() == null) {
            row.setId(ids.incrementAndGet());
        }
        rows.removeIf(existing -> existing.getId().equals(row.getId()));
        rows.add(row);
        return row;
    }
}
