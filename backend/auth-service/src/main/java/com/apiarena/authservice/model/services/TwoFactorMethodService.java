package com.apiarena.authservice.model.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.authservice.config.TwoFactorProperties;
import com.apiarena.authservice.exception.ApiException;
import com.apiarena.authservice.model.dto.UserDTO;
import com.apiarena.authservice.model.entities.TwoFactorMethodKind;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.model.entities.UserTwoFactorMethod;
import com.apiarena.authservice.repository.UserRepository;
import com.apiarena.authservice.repository.UserTwoFactorMethodRepository;

import lombok.RequiredArgsConstructor;

/**
 * Normalized 2FA methods. {@code users.totp_enabled} stays in sync (dual-write) until a later
 * contract drops that column. {@link #hasAnyTwoFactorEnabled(User)} is the check later tickets
 * (teacher verification) should call.
 */
@Service
@RequiredArgsConstructor
public class TwoFactorMethodService {

    private final UserTwoFactorMethodRepository methodRepository;
    private final UserRepository userRepository;
    private final TwoFactorProperties properties;

    /** What the login screen should ask for after the password step. */
    public record TwoFactorLoginView(
            boolean totpEnrolled,
            String primaryMethod,
            List<String> methods,
            boolean emailAllowed) {
    }

    /**
     * True when any method is on. Also true when {@code totp_enabled} is set but the backfill
     * row does not exist yet, so login cannot skip TOTP between deploy and the SQL run.
     */
    public boolean hasAnyTwoFactorEnabled(User user) {
        if (user == null) {
            return false;
        }
        if (Boolean.TRUE.equals(user.getTotpEnabled())) {
            return true;
        }
        return user.getId() != null && methodRepository.existsByUserIdAndEnabledTrue(user.getId());
    }

    public TwoFactorLoginView loginView(User user) {
        ensureTotpRow(user);
        boolean admin = user.getRole() == User.Role.ADMIN;
        boolean totp = hasTotp(user);
        boolean emailUsable = emailLoginAllowed(user);
        List<String> methods = new ArrayList<>();
        if (totp) {
            methods.add(TwoFactorMethodKind.TOTP.name());
        }
        if (emailUsable) {
            methods.add(TwoFactorMethodKind.EMAIL.name());
        }
        String primary = null;
        if (admin && totp) {
            primary = TwoFactorMethodKind.TOTP.name();
        } else if (!methods.isEmpty() && user.getId() != null) {
            primary = methodRepository.findByUserId(user.getId()).stream()
                    .filter(row -> row.isEnabled() && row.isPrimary())
                    .map(row -> row.getMethod().name())
                    .filter(methods::contains)
                    .findFirst()
                    .orElse(methods.get(0));
        }
        return new TwoFactorLoginView(totp, primary, List.copyOf(methods), emailUsable);
    }

    public boolean isEmailEnabled(User user) {
        return user != null && user.getId() != null && isEnabled(user.getId(), TwoFactorMethodKind.EMAIL);
    }

    /** Admins can sign in with email only as recovery, and only when the flag and TOTP are on. */
    public boolean emailLoginAllowed(User user) {
        if (user == null || user.getId() == null || !isEnabled(user.getId(), TwoFactorMethodKind.EMAIL)) {
            return false;
        }
        if (user.getRole() != User.Role.ADMIN) {
            return true;
        }
        return properties.isAdminAllowEmail() && hasTotp(user);
    }

    public UserDTO enrich(UserDTO dto, User user) {
        if (dto == null || user == null) {
            return dto;
        }
        boolean totp = hasTotp(user);
        boolean email = user.getId() != null && isEnabled(user.getId(), TwoFactorMethodKind.EMAIL);
        String primary = null;
        if (user.getId() != null) {
            primary = methodRepository.findByUserId(user.getId()).stream()
                    .filter(row -> row.isEnabled() && row.isPrimary())
                    .map(row -> row.getMethod().name())
                    .findFirst()
                    .orElse(null);
        }
        if (user.getRole() == User.Role.ADMIN && totp) {
            primary = TwoFactorMethodKind.TOTP.name();
        } else if (primary == null && totp) {
            primary = TwoFactorMethodKind.TOTP.name();
        } else if (primary == null && email) {
            primary = TwoFactorMethodKind.EMAIL.name();
        }
        dto.setTwoFactorEnabled(totp);
        dto.setEmailTwoFactorEnabled(email);
        dto.setTwoFactorPrimary(primary);
        dto.setEmailTwoFactorAllowed(canEnrollEmail(user));
        return dto;
    }

    @Transactional
    public void markTotpEnabled(User user) {
        user.setTotpEnabled(true);
        userRepository.save(user);
        UserTwoFactorMethod row = upsert(user.getId(), TwoFactorMethodKind.TOTP);
        row.setEnabled(true);
        if (user.getRole() == User.Role.ADMIN || !hasOtherPrimary(user.getId(), TwoFactorMethodKind.TOTP)) {
            clearPrimary(user.getId());
            row.setPrimary(true);
        }
        methodRepository.save(row);
    }

    @Transactional
    public void markTotpDisabled(User user) {
        if (user.getRole() == User.Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_2FA_ADMIN_REQUIRED",
                    "Admin accounts must keep authenticator two-factor enabled");
        }
        user.setTotpSecret(null);
        user.setTotpEnabled(false);
        userRepository.save(user);
        methodRepository.findByUserIdAndMethod(user.getId(), TwoFactorMethodKind.TOTP).ifPresent(row -> {
            row.setEnabled(false);
            row.setPrimary(false);
            methodRepository.save(row);
        });
        promotePrimary(user);
    }

    /** Admin console reset: drop TOTP so the next login re-enrols. Does not remove email recovery. */
    @Transactional
    public void clearTotp(User user) {
        user.setTotpSecret(null);
        user.setTotpEnabled(false);
        userRepository.save(user);
        methodRepository.findByUserIdAndMethod(user.getId(), TwoFactorMethodKind.TOTP).ifPresent(row -> {
            row.setEnabled(false);
            row.setPrimary(false);
            methodRepository.save(row);
        });
        if (user.getRole() != User.Role.ADMIN) {
            promotePrimary(user);
        }
    }

    @Transactional
    public void markEmailEnabled(User user) {
        assertCanEnableEmail(user);
        UserTwoFactorMethod row = upsert(user.getId(), TwoFactorMethodKind.EMAIL);
        row.setEnabled(true);
        if (user.getRole() == User.Role.ADMIN) {
            row.setPrimary(false);
        } else if (!hasOtherPrimary(user.getId(), TwoFactorMethodKind.EMAIL)) {
            clearPrimary(user.getId());
            row.setPrimary(true);
        }
        methodRepository.save(row);
    }

    @Transactional
    public void markEmailDisabled(User user) {
        if (user.getId() == null || !isEnabled(user.getId(), TwoFactorMethodKind.EMAIL)) {
            return;
        }
        methodRepository.findByUserIdAndMethod(user.getId(), TwoFactorMethodKind.EMAIL).ifPresent(row -> {
            row.setEnabled(false);
            row.setPrimary(false);
            methodRepository.save(row);
        });
        promotePrimary(user);
    }

    public void assertCanEnableEmail(User user) {
        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_EMAIL_NOT_VERIFIED",
                    "Verify your email before turning on email codes");
        }
        if (user.getRole() == User.Role.ADMIN && !properties.isAdminAllowEmail()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_2FA_EMAIL_NOT_ALLOWED",
                    "Email codes are disabled for admin accounts");
        }
        if (user.getRole() == User.Role.ADMIN && !hasTotp(user)) {
            throw new ApiException(HttpStatus.CONFLICT, "AUTH_2FA_TOTP_REQUIRED",
                    "Admins must enable an authenticator app before email recovery");
        }
    }

    private boolean canEnrollEmail(User user) {
        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            return false;
        }
        if (user.getRole() != User.Role.ADMIN) {
            return true;
        }
        return properties.isAdminAllowEmail() && hasTotp(user);
    }

    private boolean hasTotp(User user) {
        if (Boolean.TRUE.equals(user.getTotpEnabled())) {
            return true;
        }
        return user.getId() != null && isEnabled(user.getId(), TwoFactorMethodKind.TOTP);
    }

    private boolean isEnabled(Long userId, TwoFactorMethodKind method) {
        return methodRepository.findByUserIdAndMethod(userId, method)
                .map(UserTwoFactorMethod::isEnabled)
                .orElse(false);
    }

    /** Keep a row for accounts that still only have the legacy totp_enabled flag. */
    private void ensureTotpRow(User user) {
        if (user.getId() == null || !Boolean.TRUE.equals(user.getTotpEnabled())) {
            return;
        }
        boolean present = methodRepository.findByUserIdAndMethod(user.getId(), TwoFactorMethodKind.TOTP)
                .map(UserTwoFactorMethod::isEnabled)
                .orElse(false);
        if (!present) {
            markTotpEnabled(user);
        }
    }

    private boolean hasOtherPrimary(Long userId, TwoFactorMethodKind method) {
        return methodRepository.findByUserId(userId).stream()
                .anyMatch(row -> row.isEnabled() && row.isPrimary() && row.getMethod() != method);
    }

    private void clearPrimary(Long userId) {
        for (UserTwoFactorMethod row : methodRepository.findByUserId(userId)) {
            if (row.isPrimary()) {
                row.setPrimary(false);
                methodRepository.saveAndFlush(row);
            }
        }
    }

    private void promotePrimary(User user) {
        if (user.getId() == null) {
            return;
        }
        List<UserTwoFactorMethod> rows = methodRepository.findByUserId(user.getId());
        if (rows.stream().anyMatch(row -> row.isEnabled() && row.isPrimary())) {
            return;
        }
        UserTwoFactorMethod next = rows.stream()
                .filter(row -> row.isEnabled() && row.getMethod() == TwoFactorMethodKind.TOTP)
                .findFirst()
                .orElseGet(() -> rows.stream()
                        .filter(row -> row.isEnabled() && row.getMethod() == TwoFactorMethodKind.EMAIL)
                        .findFirst()
                        .orElse(null));
        if (next != null) {
            next.setPrimary(true);
            methodRepository.save(next);
        }
    }

    private UserTwoFactorMethod upsert(Long userId, TwoFactorMethodKind method) {
        return methodRepository.findByUserIdAndMethod(userId, method).orElseGet(() -> {
            UserTwoFactorMethod created = new UserTwoFactorMethod();
            created.setUserId(userId);
            created.setMethod(method);
            created.setCreatedAt(LocalDateTime.now());
            return created;
        });
    }
}
