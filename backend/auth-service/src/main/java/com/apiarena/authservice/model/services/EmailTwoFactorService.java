package com.apiarena.authservice.model.services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.authservice.exception.ApiException;
import com.apiarena.authservice.model.dto.AuthResponse;
import com.apiarena.authservice.model.dto.UserDTO;
import com.apiarena.authservice.model.entities.TwoFactorCodePurpose;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/** Email codes at login (pending token) and from account settings (session). */
@Service
@RequiredArgsConstructor
public class EmailTwoFactorService {

    private final TwoFactorSessionService twoFactorSessionService;
    private final EmailTwoFactorCodeService emailTwoFactorCodeService;
    private final TwoFactorMethodService twoFactorMethodService;
    private final UserRepository userRepository;

    @Transactional
    public void sendLoginCode(String pendingToken) {
        User user = twoFactorSessionService.requirePending(pendingToken);
        if (!twoFactorMethodService.emailLoginAllowed(user)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_2FA_EMAIL_NOT_ALLOWED",
                    "Email verification is not available for this account");
        }
        emailTwoFactorCodeService.issue(user, TwoFactorCodePurpose.LOGIN);
    }

    @Transactional
    public AuthResponse verifyLogin(String pendingToken, String code) {
        User user = twoFactorSessionService.requirePending(pendingToken);
        if (!twoFactorMethodService.emailLoginAllowed(user)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_2FA_EMAIL_NOT_ALLOWED",
                    "Email verification is not available for this account");
        }
        emailTwoFactorCodeService.verify(user.getId(), TwoFactorCodePurpose.LOGIN, code);
        return twoFactorSessionService.issueTokens(user);
    }

    @Transactional
    public void sendAccountCode(String email, String purposeRaw) {
        TwoFactorCodePurpose purpose = accountPurpose(purposeRaw);
        User user = requireUser(email);
        if (purpose == TwoFactorCodePurpose.ENABLE) {
            twoFactorMethodService.assertCanEnableEmail(user);
        } else if (!twoFactorMethodService.isEmailEnabled(user)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "AUTH_2FA_EMAIL_NOT_ENABLED",
                    "Email verification is not on");
        }
        emailTwoFactorCodeService.issue(user, purpose);
    }

    @Transactional
    public UserDTO confirmEnable(String email, String code) {
        User user = requireUser(email);
        twoFactorMethodService.assertCanEnableEmail(user);
        emailTwoFactorCodeService.verify(user.getId(), TwoFactorCodePurpose.ENABLE, code);
        twoFactorMethodService.markEmailEnabled(user);
        return twoFactorMethodService.enrich(UserDTO.fromEntity(user), user);
    }

    @Transactional
    public UserDTO confirmDisable(String email, String code) {
        User user = requireUser(email);
        if (!twoFactorMethodService.isEmailEnabled(user)) {
            return twoFactorMethodService.enrich(UserDTO.fromEntity(user), user);
        }
        emailTwoFactorCodeService.verify(user.getId(), TwoFactorCodePurpose.DISABLE, code);
        twoFactorMethodService.markEmailDisabled(user);
        return twoFactorMethodService.enrich(UserDTO.fromEntity(user), user);
    }

    private User requireUser(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_UNAUTHENTICATED",
                        "Not authenticated"));
        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_EMAIL_NOT_VERIFIED",
                    "Verify your email before using email codes");
        }
        return user;
    }

    private static TwoFactorCodePurpose accountPurpose(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "AUTH_2FA_PURPOSE_INVALID",
                    "Unsupported email code purpose");
        }
        try {
            TwoFactorCodePurpose purpose = TwoFactorCodePurpose.valueOf(raw.trim().toUpperCase());
            if (purpose == TwoFactorCodePurpose.LOGIN) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "AUTH_2FA_PURPOSE_INVALID",
                        "Unsupported email code purpose");
            }
            return purpose;
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "AUTH_2FA_PURPOSE_INVALID",
                    "Unsupported email code purpose");
        }
    }
}
