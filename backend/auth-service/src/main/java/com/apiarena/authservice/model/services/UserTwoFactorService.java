package com.apiarena.authservice.model.services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.authservice.exception.ApiException;
import com.apiarena.authservice.model.dto.TwoFactorEnrollResponse;
import com.apiarena.authservice.model.dto.UserDTO;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * Voluntary TOTP 2FA for any signed-in user (enable/disable from account settings).
 * Distinct from {@link AdminTwoFactorService}, which runs mid-login on a pending token; here the
 * user is already authenticated, so the account comes from the session, not a pending token.
 * Once enabled, {@code AuthService.login} routes the account through the same TOTP step as admins.
 */
@Service
@RequiredArgsConstructor
public class UserTwoFactorService {

    private final UserRepository userRepository;
    private final TotpService totpService;

    /** Get (or lazily create) an unverified secret to scan. Idempotent: same QR until enabled. */
    @Transactional
    public TwoFactorEnrollResponse enroll(String email) {
        User user = require(email);
        if (Boolean.TRUE.equals(user.getTotpEnabled())) {
            throw new ApiException(HttpStatus.CONFLICT, "AUTH_2FA_ALREADY_ENROLLED", "2FA is already enabled");
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

    /** Confirm the first code to turn 2FA on. */
    @Transactional
    public UserDTO enable(String email, String code) {
        User user = require(email);
        if (Boolean.TRUE.equals(user.getTotpEnabled())) {
            return UserDTO.fromEntity(user);
        }
        if (user.getTotpSecret() == null || user.getTotpSecret().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "AUTH_2FA_NOT_ENROLLED", "Start 2FA setup first");
        }
        if (!totpService.verify(user.getTotpSecret(), code)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_2FA_INVALID_CODE", "Invalid authentication code");
        }
        user.setTotpEnabled(true);
        userRepository.save(user);
        return UserDTO.fromEntity(user);
    }

    /** Turn 2FA off. Requires a valid current code so a hijacked session alone can't disable it. */
    @Transactional
    public UserDTO disable(String email, String code) {
        User user = require(email);
        if (!Boolean.TRUE.equals(user.getTotpEnabled())) {
            return UserDTO.fromEntity(user);
        }
        if (!totpService.verify(user.getTotpSecret(), code)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_2FA_INVALID_CODE", "Invalid authentication code");
        }
        user.setTotpSecret(null);
        user.setTotpEnabled(false);
        userRepository.save(user);
        return UserDTO.fromEntity(user);
    }

    private User require(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_UNAUTHENTICATED", "Not authenticated"));
    }
}
