package com.apiarena.authservice.model.services;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.authservice.exception.ApiException;
import com.apiarena.authservice.model.dto.AuthResponse;
import com.apiarena.authservice.model.dto.TwoFactorEnrollResponse;
import com.apiarena.authservice.model.dto.UserDTO;
import com.apiarena.authservice.model.entities.RefreshToken;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.repository.UserRepository;
import com.apiarena.authservice.util.AccountStatus;

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
    private final IJwtService jwtService;
    private final IRefreshTokenService refreshTokenService;
    private final IUserService userService;

    /** First login: generate + persist a secret (disabled) so the admin can add it to their app. */
    @Transactional
    public TwoFactorEnrollResponse enroll(String pendingToken) {
        User user = requirePendingAdmin(pendingToken);
        if (Boolean.TRUE.equals(user.getTotpEnabled())) {
            throw new ApiException(HttpStatus.CONFLICT, "AUTH_2FA_ALREADY_ENROLLED",
                    "This admin already has 2FA enabled");
        }
        String secret = totpService.generateSecret();
        user.setTotpSecret(secret);
        user.setTotpEnabled(false);
        userRepository.save(user);
        return new TwoFactorEnrollResponse(secret, totpService.otpauthUri(secret, user.getEmail()));
    }

    /** Verify the TOTP code; on success (enabling on first use) issue the real access + refresh tokens. */
    @Transactional
    public AuthResponse verify(String pendingToken, String code) {
        User user = requirePendingAdmin(pendingToken);
        if (user.getTotpSecret() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "AUTH_2FA_NOT_ENROLLED",
                    "Start 2FA enrolment first");
        }
        if (!totpService.verify(user.getTotpSecret(), code)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_2FA_INVALID_CODE", "Invalid authentication code");
        }
        if (!Boolean.TRUE.equals(user.getTotpEnabled())) {
            user.setTotpEnabled(true);
            userRepository.save(user);
        }

        userService.updateLastLogin(user.getEmail());

        UserDetails userDetails = userService.loadUserByUsername(user.getEmail());
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        String accessToken = jwtService.generateAccessToken(claims, userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return new AuthResponse(UserDTO.fromEntity(user), accessToken, refreshToken.getRawToken());
    }

    private User requirePendingAdmin(String pendingToken) {
        if (pendingToken == null || pendingToken.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_2FA_PENDING_INVALID", "Missing 2FA session");
        }
        final String email;
        final Boolean pending;
        try {
            email = jwtService.extractUsername(pendingToken);
            pending = jwtService.extractClaim(pendingToken, c -> c.get("twoFactorPending", Boolean.class));
            if (jwtService.isTokenExpired(pendingToken)) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_2FA_PENDING_EXPIRED", "2FA session expired");
            }
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_2FA_PENDING_INVALID", "Invalid 2FA session");
        }
        if (!Boolean.TRUE.equals(pending)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_2FA_PENDING_INVALID", "Invalid 2FA session");
        }
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_2FA_PENDING_INVALID",
                        "Invalid 2FA session"));
        if (user.getRole() != User.Role.ADMIN || !AccountStatus.isLoginAllowed(user)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_2FA_FORBIDDEN", "Not an active admin account");
        }
        return user;
    }
}
