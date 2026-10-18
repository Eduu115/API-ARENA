package com.apiarena.authservice.model.services;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.authservice.exception.ApiException;
import com.apiarena.authservice.model.dto.AuthResponse;
import com.apiarena.authservice.model.dto.UserDTO;
import com.apiarena.authservice.model.entities.RefreshToken;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.repository.UserRepository;
import com.apiarena.authservice.util.AccountStatus;

import lombok.RequiredArgsConstructor;

/**
 * Pending-token gate shared by TOTP and email. The token only proves the password step succeeded.
 */
@Service
@RequiredArgsConstructor
public class TwoFactorSessionService {

    private final UserRepository userRepository;
    private final IJwtService jwtService;
    private final IRefreshTokenService refreshTokenService;
    private final IUserService userService;
    private final TwoFactorMethodService twoFactorMethodService;

    public User requirePending(String pendingToken) {
        if (pendingToken == null || pendingToken.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_2FA_PENDING_INVALID", "Missing 2FA session");
        }
        final String email;
        final Boolean pending;
        try {
            email = jwtService.extractUsername(pendingToken);
            pending = jwtService.extractClaim(pendingToken, claims -> claims.get("twoFactorPending", Boolean.class));
            if (jwtService.isTokenExpired(pendingToken)) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_2FA_PENDING_EXPIRED", "2FA session expired");
            }
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_2FA_PENDING_INVALID", "Invalid 2FA session");
        }
        if (!Boolean.TRUE.equals(pending)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_2FA_PENDING_INVALID", "Invalid 2FA session");
        }
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_2FA_PENDING_INVALID",
                        "Invalid 2FA session"));
        boolean eligible = user.getRole() == User.Role.ADMIN || twoFactorMethodService.hasAnyTwoFactorEnabled(user);
        if (!eligible || !AccountStatus.isLoginAllowed(user)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_2FA_FORBIDDEN", "2FA not available for this account");
        }
        return user;
    }

    @Transactional
    public AuthResponse issueTokens(User user) {
        userService.updateLastLogin(user.getEmail());
        UserDetails userDetails = userService.loadUserByUsername(user.getEmail());
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        String accessToken = jwtService.generateAccessToken(claims, userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        User fresh = userRepository.findById(user.getId()).orElse(user);
        return new AuthResponse(
                twoFactorMethodService.enrich(UserDTO.fromEntity(fresh), fresh),
                accessToken,
                refreshToken.getRawToken());
    }
}
