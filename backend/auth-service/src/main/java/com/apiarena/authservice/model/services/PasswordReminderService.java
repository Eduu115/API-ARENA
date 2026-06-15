package com.apiarena.authservice.model.services;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.authservice.config.EmailProperties;
import com.apiarena.authservice.config.PasswordReminderProperties;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PasswordReminderService {

    private static final Logger log = LoggerFactory.getLogger(PasswordReminderService.class);

    private final UserRepository userRepository;
    private final EmailDispatchService emailDispatchService;
    private final PasswordReminderProperties properties;
    private final EmailProperties emailProperties;

    /**
     * Sends password rotation reminder emails to verified active users whose password
     * is at least {@code intervalDays} old and who have not been reminded in that window.
     */
    @Transactional
    public int processDueReminders() {
        if (!properties.isEnabled()) {
            log.debug("Password reminder job disabled");
            return 0;
        }
        String apiKey = emailProperties.getResendApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.debug("Password reminder skipped: RESEND_API_KEY not configured");
            return 0;
        }

        int intervalDays = Math.max(1, properties.getIntervalDays());
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        List<User> users = userRepository.findByEmailVerifiedTrueAndIsActiveTrue();
        int sent = 0;

        for (User user : users) {
            if (!isDue(user, now, intervalDays)) {
                continue;
            }
            try {
                emailDispatchService.sendPasswordRotationReminderEmail(user.getEmail(), user.getUsername());
                user.setLastPasswordReminderSentAt(now);
                userRepository.save(user);
                sent++;
            } catch (Exception e) {
                log.warn("Failed to send password reminder to userId={}: {}", user.getId(), e.getMessage());
            }
        }

        if (sent > 0) {
            log.info("Password rotation reminders sent: {}", sent);
        }
        return sent;
    }

    static boolean isDue(User user, LocalDateTime now, int intervalDays) {
        LocalDateTime changedAt = user.getPasswordChangedAt() != null
                ? user.getPasswordChangedAt()
                : user.getCreatedAt();
        if (changedAt == null) {
            return false;
        }
        if (now.isBefore(changedAt.plusDays(intervalDays))) {
            return false;
        }
        LocalDateTime lastSent = user.getLastPasswordReminderSentAt();
        return lastSent == null || !now.isBefore(lastSent.plusDays(intervalDays));
    }

    /** Backfill password_changed_at for legacy rows (uses created_at). */
    @Transactional
    public int backfillPasswordChangedAt() {
        List<User> users = userRepository.findAll();
        int updated = 0;
        for (User user : users) {
            if (user.getPasswordChangedAt() == null && user.getCreatedAt() != null) {
                user.setPasswordChangedAt(user.getCreatedAt());
                userRepository.save(user);
                updated++;
            }
        }
        if (updated > 0) {
            log.info("Backfilled password_changed_at for {} users", updated);
        }
        return updated;
    }
}
