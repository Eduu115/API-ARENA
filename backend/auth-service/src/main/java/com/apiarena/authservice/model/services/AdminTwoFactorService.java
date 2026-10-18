package com.apiarena.authservice.model.services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.authservice.exception.ApiException;
import com.apiarena.authservice.model.dto.AuthResponse;
import com.apiarena.authservice.model.dto.TwoFactorEnrollResponse;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * ADMIN 2FA (TOTP) enrolment + verification, the second factor of the bunker login.
 * Both steps are authenticated by the short-lived pending token from {@code AuthService.login},
 * not by a full session (no tokens exist yet at this point).
 */
@Service
@RequiredArgsConstructor
public class AdminTwoFactorService {

    private final UserRepository userRepository;
    private final TotpService totpService;
    private final TwoFactorSessionService twoFactorSessionService;
    private final TwoFactorMethodService twoFactorMethodService;

    /**
     * First login: return a secret (disabled) so the admin can scan it. Idempotent — reuses the
     * existing unverified secret so re-opening/retrying enrolment keeps the same QR instead of
     * invalidating what was already scanned (a fresh secret each call = a new account every time).
     */
    @Transactional
    public TwoFactorEnrollResponse enroll(String pendingToken) {
        User user = twoFactorSessionService.requirePending(pendingToken);
        if (Boolean.TRUE.equals(user.getTotpEnabled())) {
            throw new ApiException(HttpStatus.CONFLICT, "AUTH_2FA_ALREADY_ENROLLED",
                    "This admin already has 2FA enabled");
        }
        String secret = user.getTotpSecret();
        if (secret == null || secret.isBlank()) {
            secret = totpService.generateSecret();
            user.setTotpSecret(secret);
            user.setTotpEnabled(false);
            userRepository.save(user);
        }
        return new TwoFactorEnrollResponse(secret, totpService.otpauthUri(secret, user.getEmail()));
    }

    /** Verify the TOTP code; on success (enabling on first use) issue the real access + refresh tokens. */
    @Transactional
    public AuthResponse verify(String pendingToken, String code) {
        User user = twoFactorSessionService.requirePending(pendingToken);
        if (user.getTotpSecret() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "AUTH_2FA_NOT_ENROLLED",
                    "Start 2FA enrolment first");
        }
        if (!totpService.verify(user.getTotpSecret(), code)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_2FA_INVALID_CODE", "Invalid authentication code");
        }
        if (!Boolean.TRUE.equals(user.getTotpEnabled())) {
            twoFactorMethodService.markTotpEnabled(user);
        }

        return twoFactorSessionService.issueTokens(user);
    }
}
