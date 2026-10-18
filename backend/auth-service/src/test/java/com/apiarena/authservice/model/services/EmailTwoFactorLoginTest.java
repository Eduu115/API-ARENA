package com.apiarena.authservice.model.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.apiarena.authservice.config.JwtProperties;
import com.apiarena.authservice.exception.ApiException;
import com.apiarena.authservice.model.dto.AuthResponse;
import com.apiarena.authservice.model.entities.RefreshToken;
import com.apiarena.authservice.model.entities.TwoFactorCodePurpose;
import com.apiarena.authservice.model.entities.TwoFactorEmailCode;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.repository.TwoFactorEmailCodeRepository;
import com.apiarena.authservice.repository.UserRepository;
import com.apiarena.authservice.security.RedisRateLimiter;

/** Password step is assumed done: pending token → email code → real tokens. */
class EmailTwoFactorLoginTest {

    private static final String CODE = "654321";

    private final List<TwoFactorEmailCode> codes = new ArrayList<>();
    private final AtomicLong ids = new AtomicLong();

    private User user;
    private JwtService jwtService;
    private TwoFactorMethodService methods;
    private EmailTwoFactorService service;

    @BeforeEach
    void setUp() {
        user = new User("arclight", "arclight@apiarena.dev", "hash", User.Role.STUDENT);
        user.setId(9L);
        user.setEmailVerified(true);
        user.setIsActive(true);
        user.setPreferredLocale("en");

        byte[] key = new byte[32];
        java.util.Arrays.fill(key, (byte) 7);
        JwtProperties properties = new JwtProperties();
        properties.setSecret(Base64.getEncoder().encodeToString(key));
        properties.setExpiration(3_600_000L);
        properties.setRefreshExpiration(86_400_000L);
        jwtService = new JwtService(properties);

        UserRepository users = mock(UserRepository.class);
        when(users.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        when(users.findById(user.getId())).thenReturn(Optional.of(user));

        methods = mock(TwoFactorMethodService.class);
        when(methods.hasAnyTwoFactorEnabled(user)).thenReturn(true);
        when(methods.emailLoginAllowed(user)).thenReturn(true);
        when(methods.enrich(any(), any())).thenAnswer(invocation -> invocation.getArgument(0));

        IUserService userService = mock(IUserService.class);
        UserDetails details = org.springframework.security.core.userdetails.User.withUsername(user.getEmail())
                .password("hash")
                .roles("STUDENT")
                .build();
        when(userService.loadUserByUsername(user.getEmail())).thenReturn(details);

        IRefreshTokenService refreshTokens = mock(IRefreshTokenService.class);
        RefreshToken refresh = new RefreshToken();
        refresh.setRawToken("refresh-raw");
        when(refreshTokens.createRefreshToken(user)).thenReturn(refresh);

        TwoFactorSessionService sessions = new TwoFactorSessionService(
                users, jwtService, refreshTokens, userService, methods);

        TwoFactorEmailCodeRepository codeRepository = mock(TwoFactorEmailCodeRepository.class);
        when(codeRepository.save(any())).thenAnswer(invocation -> store(invocation.getArgument(0)));
        when(codeRepository.findFirstByUserIdAndPurposeOrderByCreatedAtDescIdDesc(any(), any()))
                .thenAnswer(invocation -> codes.stream()
                        .filter(row -> invocation.getArgument(0).equals(row.getUserId())
                                && invocation.getArgument(1) == row.getPurpose())
                        .max(Comparator.comparing(TwoFactorEmailCode::getCreatedAt)
                                .thenComparing(TwoFactorEmailCode::getId)));

        RedisRateLimiter rateLimiter = mock(RedisRateLimiter.class);
        when(rateLimiter.check(anyString(), anyInt(), any()))
                .thenReturn(new RedisRateLimiter.RateLimitDecision(true, 5, 4, 60));

        EmailDispatchService mail = mock(EmailDispatchService.class);
        EmailTwoFactorCodeService codeService = new EmailTwoFactorCodeService(
                codeRepository,
                new BCryptPasswordEncoder(4),
                rateLimiter,
                () -> CODE,
                mail,
                Clock.systemUTC());

        service = new EmailTwoFactorService(sessions, codeService, methods, users);
    }

    @Test
    void loginWithEmailCodeIssuesTokensAndRejectsReuse() {
        String pending = jwtService.generatePendingTwoFactorToken(user.getEmail(), user.getId());
        service.sendLoginCode(pending);

        AuthResponse response = service.verifyLogin(pending, CODE);
        assertNotNull(response.getAccessToken());
        assertEquals("refresh-raw", response.getRefreshToken());
        assertEquals(user.getEmail(), response.getUser().getEmail());
        assertNull(response.getPendingToken());

        ApiException reused = assertThrows(ApiException.class, () -> service.verifyLogin(pending, CODE));
        assertEquals("AUTH_2FA_CODE_REUSED", reused.getCode());
    }

    @Test
    void wrongEmailCodeDoesNotIssueTokens() {
        String pending = jwtService.generatePendingTwoFactorToken(user.getEmail(), user.getId());
        service.sendLoginCode(pending);
        ApiException wrong = assertThrows(ApiException.class, () -> service.verifyLogin(pending, "000000"));
        assertEquals("AUTH_2FA_INVALID_CODE", wrong.getCode());
        assertEquals(TwoFactorCodePurpose.LOGIN, codes.get(0).getPurpose());
        assertNull(codes.get(0).getConsumedAt());
    }

    @Test
    void confirmingAnEnableCodeMarksEmailOnAndRejectsReuse() {
        service.sendAccountCode(user.getEmail(), "ENABLE");
        assertNotNull(service.confirmEnable(user.getEmail(), CODE));
        verify(methods).markEmailEnabled(user);

        ApiException reused = assertThrows(ApiException.class,
                () -> service.confirmEnable(user.getEmail(), CODE));
        assertEquals("AUTH_2FA_CODE_REUSED", reused.getCode());
    }

    private TwoFactorEmailCode store(TwoFactorEmailCode row) {
        if (row.getId() == null) {
            row.setId(ids.incrementAndGet());
        }
        codes.removeIf(existing -> existing.getId().equals(row.getId()));
        codes.add(row);
        return row;
    }
}
