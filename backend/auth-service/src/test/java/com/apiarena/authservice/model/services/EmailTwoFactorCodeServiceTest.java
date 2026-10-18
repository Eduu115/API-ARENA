package com.apiarena.authservice.model.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.apiarena.authservice.exception.ApiException;
import com.apiarena.authservice.model.entities.TwoFactorCodePurpose;
import com.apiarena.authservice.model.entities.TwoFactorEmailCode;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.repository.TwoFactorEmailCodeRepository;
import com.apiarena.authservice.security.RedisRateLimiter;

class EmailTwoFactorCodeServiceTest {

    private static final String CODE = "123456";

    private final List<TwoFactorEmailCode> rows = new ArrayList<>();
    private final AtomicLong ids = new AtomicLong();
    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);

    private TwoFactorEmailCodeRepository repository;
    private RedisRateLimiter rateLimiter;
    private EmailDispatchService emailDispatchService;
    private EmailTwoFactorCodeService service;
    private User user;

    @BeforeEach
    void setUp() {
        repository = mock(TwoFactorEmailCodeRepository.class);
        rateLimiter = mock(RedisRateLimiter.class);
        emailDispatchService = mock(EmailDispatchService.class);
        when(rateLimiter.check(anyString(), anyInt(), any())).thenReturn(allowed());
        when(repository.save(any())).thenAnswer(invocation -> store(invocation.getArgument(0)));
        when(repository.findFirstByUserIdAndPurposeOrderByCreatedAtDescIdDesc(any(), any()))
                .thenAnswer(invocation -> latest(invocation.getArgument(0), invocation.getArgument(1)));
        service = new EmailTwoFactorCodeService(
                repository,
                encoder,
                rateLimiter,
                () -> CODE,
                emailDispatchService,
                Clock.systemUTC());
        user = new User("arclight", "arclight@apiarena.dev", "hash", User.Role.STUDENT);
        user.setId(7L);
        user.setPreferredLocale("es");
    }

    @Test
    void correctCodeIsHashedSingleUse() {
        service.issue(user, TwoFactorCodePurpose.LOGIN);
        TwoFactorEmailCode stored = rows.get(0);
        assertNotEquals(CODE, stored.getCodeHash());
        assertTrue(encoder.matches(CODE, stored.getCodeHash()));
        assertTrue(stored.getExpiresAt().isAfter(stored.getCreatedAt().plusMinutes(9)));
        assertTrue(stored.getExpiresAt().isBefore(stored.getCreatedAt().plusMinutes(11)));
        verify(emailDispatchService).sendTwoFactorCodeEmail(
                "arclight@apiarena.dev", "arclight", CODE, "LOGIN", "es");

        service.verify(user.getId(), TwoFactorCodePurpose.LOGIN, CODE);
        assertTrue(stored.getConsumedAt() != null);

        ApiException reused = assertThrows(ApiException.class,
                () -> service.verify(user.getId(), TwoFactorCodePurpose.LOGIN, CODE));
        assertEquals("AUTH_2FA_CODE_REUSED", reused.getCode());
    }

    @Test
    void wrongCodeIncrementsAttemptsAndStaysOpen() {
        service.issue(user, TwoFactorCodePurpose.LOGIN);
        ApiException wrong = assertThrows(ApiException.class,
                () -> service.verify(user.getId(), TwoFactorCodePurpose.LOGIN, "000000"));
        assertEquals("AUTH_2FA_INVALID_CODE", wrong.getCode());
        assertEquals(1, rows.get(0).getAttempts());
        assertNull(rows.get(0).getConsumedAt());
    }

    @Test
    void expiredCodeIsRejected() {
        service.issue(user, TwoFactorCodePurpose.ENABLE);
        rows.get(0).setExpiresAt(LocalDateTime.now(Clock.systemUTC()).minusMinutes(1));
        ApiException expired = assertThrows(ApiException.class,
                () -> service.verify(user.getId(), TwoFactorCodePurpose.ENABLE, CODE));
        assertEquals("AUTH_2FA_CODE_EXPIRED", expired.getCode());
        assertNull(rows.get(0).getConsumedAt());
    }

    @Test
    void fifthWrongAttemptLocksTheCode() {
        service.issue(user, TwoFactorCodePurpose.DISABLE);
        for (int i = 0; i < 5; i++) {
            ApiException wrong = assertThrows(ApiException.class,
                    () -> service.verify(user.getId(), TwoFactorCodePurpose.DISABLE, "000000"));
            assertEquals("AUTH_2FA_INVALID_CODE", wrong.getCode());
        }
        ApiException locked = assertThrows(ApiException.class,
                () -> service.verify(user.getId(), TwoFactorCodePurpose.DISABLE, CODE));
        assertEquals("AUTH_2FA_CODE_ATTEMPTS", locked.getCode());
        assertNull(rows.get(0).getConsumedAt());
    }

    @Test
    void resendIsLimitedToOnePerMinuteAndFivePerHour() {
        when(rateLimiter.check(anyString(), anyInt(), any())).thenReturn(denied());
        ApiException burst = assertThrows(ApiException.class,
                () -> service.issue(user, TwoFactorCodePurpose.LOGIN));
        assertEquals("AUTH_2FA_EMAIL_RATE_LIMIT", burst.getCode());
        assertTrue(rows.isEmpty());

        when(rateLimiter.check(org.mockito.ArgumentMatchers.startsWith("2fa-email:60s:"), anyInt(), any()))
                .thenReturn(allowed());
        when(rateLimiter.check(org.mockito.ArgumentMatchers.startsWith("2fa-email:1h:"), anyInt(), any()))
                .thenReturn(denied());
        ApiException hour = assertThrows(ApiException.class,
                () -> service.issue(user, TwoFactorCodePurpose.LOGIN));
        assertEquals("AUTH_2FA_EMAIL_RATE_LIMIT", hour.getCode());
        assertTrue(rows.isEmpty());
    }

    private TwoFactorEmailCode store(TwoFactorEmailCode row) {
        if (row.getId() == null) {
            row.setId(ids.incrementAndGet());
        }
        rows.removeIf(existing -> existing.getId().equals(row.getId()));
        rows.add(row);
        return row;
    }

    private Optional<TwoFactorEmailCode> latest(Long userId, TwoFactorCodePurpose purpose) {
        return rows.stream()
                .filter(row -> userId.equals(row.getUserId()) && purpose == row.getPurpose())
                .max(Comparator.comparing(TwoFactorEmailCode::getCreatedAt)
                        .thenComparing(TwoFactorEmailCode::getId));
    }

    private static RedisRateLimiter.RateLimitDecision allowed() {
        return new RedisRateLimiter.RateLimitDecision(true, 5, 4, 60);
    }

    private static RedisRateLimiter.RateLimitDecision denied() {
        return new RedisRateLimiter.RateLimitDecision(false, 1, 0, 60);
    }
}
