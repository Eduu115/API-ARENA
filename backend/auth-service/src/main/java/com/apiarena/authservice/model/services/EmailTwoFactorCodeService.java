package com.apiarena.authservice.model.services;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.authservice.exception.ApiException;
import com.apiarena.authservice.model.entities.TwoFactorCodePurpose;
import com.apiarena.authservice.model.entities.TwoFactorEmailCode;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.repository.TwoFactorEmailCodeRepository;
import com.apiarena.authservice.security.RedisRateLimiter;

import lombok.RequiredArgsConstructor;

/**
 * One-time email codes: 6 digits, hashed, 10 minutes, single use, 5 attempts.
 * Resend is limited to 1 per 60 seconds and 5 per hour per user (same Redis limiter as auth).
 */
@Service
@RequiredArgsConstructor
public class EmailTwoFactorCodeService {

    static final Duration TTL = Duration.ofMinutes(10);
    static final int MAX_ATTEMPTS = 5;
    static final int SENDS_PER_MINUTE = 1;
    static final int SENDS_PER_HOUR = 5;

    private final TwoFactorEmailCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisRateLimiter rateLimiter;
    private final TwoFactorCodeGenerator codeGenerator;
    private final EmailDispatchService emailDispatchService;
    private final Clock clock;

    private String dummyHash;

    /** Issue a code and email it. Returns nothing the API can show. */
    @Transactional
    public void issue(User user, TwoFactorCodePurpose purpose) {
        assertSendAllowed(user.getId());
        String code = codeGenerator.nextCode();
        LocalDateTime now = LocalDateTime.now(clock);
        TwoFactorEmailCode row = new TwoFactorEmailCode();
        row.setUserId(user.getId());
        row.setCodeHash(passwordEncoder.encode(code));
        row.setPurpose(purpose);
        row.setCreatedAt(now);
        row.setExpiresAt(now.plus(TTL));
        row.setAttempts(0);
        codeRepository.save(row);
        emailDispatchService.sendTwoFactorCodeEmail(
                user.getEmail(),
                user.getUsername(),
                code,
                purpose.name(),
                user.getPreferredLocale());
    }

    @Transactional
    public void verify(Long userId, TwoFactorCodePurpose purpose, String rawCode) {
        String code = rawCode == null ? "" : rawCode.trim();
        TwoFactorEmailCode row = codeRepository
                .findFirstByUserIdAndPurposeOrderByCreatedAtDescIdDesc(userId, purpose)
                .orElse(null);
        if (row == null) {
            passwordEncoder.matches(code, dummyHash());
            throw invalid();
        }
        boolean matches = passwordEncoder.matches(code, row.getCodeHash());
        if (row.getConsumedAt() != null) {
            throw matches
                    ? new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_2FA_CODE_REUSED", "That code was already used")
                    : invalid();
        }
        LocalDateTime now = LocalDateTime.now(clock);
        if (row.getExpiresAt() == null || !row.getExpiresAt().isAfter(now)) {
            throw matches
                    ? new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_2FA_CODE_EXPIRED", "That code has expired")
                    : invalid();
        }
        if (row.getAttempts() >= MAX_ATTEMPTS) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_2FA_CODE_ATTEMPTS",
                    "Too many attempts. Request a new code");
        }
        row.setAttempts(row.getAttempts() + 1);
        if (!matches) {
            codeRepository.save(row);
            throw invalid();
        }
        row.setConsumedAt(now);
        codeRepository.save(row);
    }

    private void assertSendAllowed(Long userId) {
        String id = String.valueOf(userId);
        RedisRateLimiter.RateLimitDecision minute = rateLimiter.check(
                "2fa-email:60s:" + id, SENDS_PER_MINUTE, Duration.ofSeconds(60));
        if (!minute.allowed()) {
            throw rateLimited();
        }
        RedisRateLimiter.RateLimitDecision hour = rateLimiter.check(
                "2fa-email:1h:" + id, SENDS_PER_HOUR, Duration.ofHours(1));
        if (!hour.allowed()) {
            throw rateLimited();
        }
    }

    private String dummyHash() {
        if (dummyHash == null) {
            dummyHash = passwordEncoder.encode("000000");
        }
        return dummyHash;
    }

    private static ApiException invalid() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_2FA_INVALID_CODE", "Invalid authentication code");
    }

    private static ApiException rateLimited() {
        return new ApiException(HttpStatus.TOO_MANY_REQUESTS, "AUTH_2FA_EMAIL_RATE_LIMIT",
                "Wait a moment before requesting another code");
    }
}
