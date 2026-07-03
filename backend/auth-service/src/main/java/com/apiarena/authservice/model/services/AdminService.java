package com.apiarena.authservice.model.services;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.authservice.exception.ApiException;
import com.apiarena.authservice.model.dto.AdminAuditRowDTO;
import com.apiarena.authservice.model.dto.AdminStatsDTO;
import com.apiarena.authservice.model.dto.AdminUserDTO;
import com.apiarena.authservice.model.dto.AuthResponse;
import com.apiarena.authservice.model.dto.UserDTO;
import com.apiarena.authservice.model.dto.ModerationRecordDTO;
import com.apiarena.authservice.model.entities.AdminAuditLog;
import com.apiarena.authservice.model.entities.ModerationRecord;
import com.apiarena.authservice.model.entities.RefreshToken;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.repository.AdminAuditLogRepository;
import com.apiarena.authservice.repository.ModerationRecordRepository;
import com.apiarena.authservice.repository.UserRepository;

import java.util.List;

import lombok.RequiredArgsConstructor;

/** Backing service for the admin console: user search, moderation, role/power management + audit trail. */
@Service
@RequiredArgsConstructor
public class AdminService {

    private static final int ONLINE_WINDOW_MINUTES = 5;
    private static final int WARN_THRESHOLD = 3;

    private final UserRepository userRepository;
    private final IRefreshTokenService refreshTokenService;
    private final IUserService userService;
    private final IJwtService jwtService;
    private final AdminAuditLogRepository auditRepository;
    private final ModerationRecordRepository moderationRepository;

    public Page<AdminUserDTO> searchUsers(String query, User.Role role, Boolean active, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return userRepository.adminSearch(query, role, active, pageable).map(AdminUserDTO::fromEntity);
    }

    public AdminUserDTO getUser(Long id) {
        return AdminUserDTO.fromEntity(loadUser(id));
    }

    /** Ban with a category, reason, optional description and optional expiry. Emails + records history. */
    @Transactional
    public AdminUserDTO ban(Long id, String category, String reason, String description, LocalDateTime until,
            String actingEmail) {
        User user = loadUser(id);
        requireNotSelf(user, actingEmail, "your own account");
        applyBan(user, category, reason, description, until, actingEmail, "BAN");
        return AdminUserDTO.fromEntity(user);
    }

    /** Unban via its own mini-form (reason + optional description), also recorded for consultation. */
    @Transactional
    public AdminUserDTO unban(Long id, String reason, String description, String actingEmail) {
        User user = loadUser(id);
        user.setIsActive(true);
        user.setBanReason(null);
        user.setBannedAt(null);
        user.setBannedUntil(null);
        user.setWarnings(0);
        userRepository.save(user);
        moderationRepository.save(new ModerationRecord(
                user.getId(), "UNBAN", null, reason, description, null, actingEmail));
        audit(actingEmail, "UNBAN", user, reason);
        return AdminUserDTO.fromEntity(user);
    }

    public List<ModerationRecordDTO> moderationHistory(Long id) {
        return moderationRepository.findByUserIdOrderByCreatedAtDesc(id).stream()
                .map(ModerationRecordDTO::fromEntity).toList();
    }

    /** Issue a warning; the WARN_THRESHOLD-th one auto-bans (permanent). Emails + audits each step. */
    @Transactional
    public AdminUserDTO warn(Long id, String reason, String actingEmail) {
        User user = loadUser(id);
        requireNotSelf(user, actingEmail, "your own account");
        int count = (user.getWarnings() != null ? user.getWarnings() : 0) + 1;
        user.setWarnings(count);
        userRepository.save(user);
        audit(actingEmail, "WARN", user, reason + " (" + count + "/" + WARN_THRESHOLD + ")");
        notify(user, "You received a warning (" + count + "/" + WARN_THRESHOLD + ")",
                "Reason: " + reason + "\n\nReaching " + WARN_THRESHOLD + " warnings results in a ban.");
        if (count >= WARN_THRESHOLD) {
            applyBan(user, "AUTO_WARNINGS", "Auto-ban: reached " + WARN_THRESHOLD + " warnings",
                    "Last warning: " + reason, null, actingEmail, "AUTO_BAN");
        }
        return AdminUserDTO.fromEntity(user);
    }

    @Transactional
    public AdminUserDTO clearWarnings(Long id, String actingEmail) {
        User user = loadUser(id);
        user.setWarnings(0);
        userRepository.save(user);
        audit(actingEmail, "CLEAR_WARNINGS", user, null);
        return AdminUserDTO.fromEntity(user);
    }

    private void applyBan(User user, String category, String reason, String description, LocalDateTime until,
            String actor, String auditAction) {
        user.setIsActive(false);
        user.setBanReason(reason);
        user.setBannedAt(LocalDateTime.now());
        user.setBannedUntil(until);
        userRepository.save(user);
        // Kill live sessions immediately; the JWT filter already rejects banned users on next call.
        refreshTokenService.revokeAllUserTokens(user);
        moderationRepository.save(new ModerationRecord(
                user.getId(), "BAN", category, reason, description, until, actor));
        String when = until != null ? "until " + until : "permanent";
        audit(actor, auditAction, user, reason + " [" + when + "]");
        StringBuilder body = new StringBuilder("Reason: ").append(reason);
        if (description != null && !description.isBlank()) {
            body.append("\n").append(description);
        }
        body.append("\nDuration: ").append(when)
                .append("\n\nContact support if you believe this is a mistake.");
        notify(user, "Your account has been suspended", body.toString());
    }

    /** Best-effort email; the underlying dispatch swallows its own errors so it never breaks the tx. */
    private void notify(User user, String title, String body) {
        userService.sendNotificationEmail(user.getId(), title, body, "MODERATION");
    }

    @Transactional
    public AdminUserDTO setRole(Long id, User.Role role, String actingEmail) {
        User user = loadUser(id);
        requireNotSelf(user, actingEmail, "your own role");
        User.Role previous = user.getRole();
        user.setRole(role);
        userRepository.save(user);
        audit(actingEmail, "SET_ROLE", user, previous + " → " + role);
        return AdminUserDTO.fromEntity(user);
    }

    @Transactional
    public AdminUserDTO verifyEmail(Long id, String actingEmail) {
        User user = loadUser(id);
        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiresAt(null);
        userRepository.save(user);
        audit(actingEmail, "VERIFY_EMAIL", user, null);
        return AdminUserDTO.fromEntity(user);
    }

    /** Revoke all refresh tokens; the JWT filter keeps working until access tokens expire (short-lived). */
    @Transactional
    public void forceLogout(Long id, String actingEmail) {
        User user = loadUser(id);
        refreshTokenService.revokeAllUserTokens(user);
        audit(actingEmail, "FORCE_LOGOUT", user, null);
    }

    /** Send the user an email + in-app notification straight from the console. */
    public void sendMessage(Long id, String title, String body, String actingEmail) {
        User user = loadUser(id);
        userService.sendNotificationEmail(user.getId(), title, body, "ADMIN");
        audit(actingEmail, "MESSAGE", user, title);
    }

    /** Clear TOTP so a locked-out admin can re-enrol on next login. */
    @Transactional
    public AdminUserDTO resetTwoFactor(Long id, String actingEmail) {
        User user = loadUser(id);
        user.setTotpSecret(null);
        user.setTotpEnabled(false);
        userRepository.save(user);
        audit(actingEmail, "RESET_2FA", user, null);
        return AdminUserDTO.fromEntity(user);
    }

    /** Manual ELO/XP adjustment. Level is recomputed from XP with the same curve as the app. */
    @Transactional
    public AdminUserDTO adjust(Long id, Integer ratingDelta, Integer xpDelta, String actingEmail) {
        User user = loadUser(id);
        StringBuilder detail = new StringBuilder();
        if (ratingDelta != null && ratingDelta != 0) {
            user.setRating(Math.max(0, user.getRating() + ratingDelta));
            detail.append("rating ").append(ratingDelta > 0 ? "+" : "").append(ratingDelta).append(' ');
        }
        if (xpDelta != null && xpDelta != 0) {
            int xp = Math.max(0, user.getExperiencePoints() + xpDelta);
            user.setExperiencePoints(xp);
            user.setLevel((int) Math.floor((1.0 + Math.sqrt(1.0 + 8.0 * xp / 300.0)) / 2.0));
            detail.append("xp ").append(xpDelta > 0 ? "+" : "").append(xpDelta);
        }
        userRepository.save(user);
        audit(actingEmail, "ADJUST", user, detail.toString().trim());
        return AdminUserDTO.fromEntity(user);
    }

    /** Impersonation: mint real tokens for the target so the admin can act as that user. */
    @Transactional
    public AuthResponse impersonate(Long id, String actingEmail) {
        User user = loadUser(id);
        requireNotSelf(user, actingEmail, "yourself");
        if (user.getRole() == User.Role.ADMIN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ADMIN_IMPERSONATE_ADMIN",
                    "Refusing to impersonate another admin");
        }
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ADMIN_IMPERSONATE_BANNED",
                    "Unban the user before impersonating");
        }
        UserDetails userDetails = userService.loadUserByUsername(user.getEmail());
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        String accessToken = jwtService.generateAccessToken(claims, userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        audit(actingEmail, "IMPERSONATE", user, null);
        return new AuthResponse(UserDTO.fromEntity(user), accessToken, refreshToken.getRawToken());
    }

    /** GDPR-grade deletion: purges submissions/replays (cross-service) then the account. */
    @Transactional
    public void deleteUser(Long id, String actingEmail) {
        User user = loadUser(id);
        requireNotSelf(user, actingEmail, "your own account");
        // Audit before the row disappears.
        audit(actingEmail, "DELETE", user, user.getEmail());
        userService.deleteAccount(user.getEmail());
    }

    public AdminStatsDTO stats() {
        LocalDateTime onlineCutoff = LocalDateTime.now().minusMinutes(ONLINE_WINDOW_MINUTES);
        return new AdminStatsDTO(
                userRepository.count(),
                userRepository.countByRole(User.Role.STUDENT),
                userRepository.countByRole(User.Role.TEACHER),
                userRepository.countByRole(User.Role.ADMIN),
                userRepository.countByIsActive(false),
                userRepository.countByLastSeenAtAfter(onlineCutoff));
    }

    public Page<AdminAuditRowDTO> auditLog(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        return auditRepository.findAllByOrderByCreatedAtDesc(pageable).map(AdminAuditRowDTO::fromEntity);
    }

    private void audit(String actor, String action, User target, String detail) {
        auditRepository.save(new AdminAuditLog(
                actor, action, target != null ? target.getId() : null,
                target != null ? target.getUsername() : null, detail));
    }

    private User loadUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ADMIN_USER_NOT_FOUND", "User not found"));
    }

    // ponytail: single-admin guard is just "not yourself"; no "last admin standing" protection yet.
    private void requireNotSelf(User target, String actingEmail, String what) {
        if (actingEmail != null && actingEmail.equalsIgnoreCase(target.getEmail())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ADMIN_SELF_ACTION",
                    "You cannot change " + what + " from the admin console");
        }
    }
}
