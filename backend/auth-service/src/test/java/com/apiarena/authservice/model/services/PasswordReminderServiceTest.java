package com.apiarena.authservice.model.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;

import com.apiarena.authservice.config.PasswordReminderProperties;
import com.apiarena.authservice.model.entities.User;

/** Interval is 120 days: not due the day before, due on the day, and again only after the last send ages out. */
class PasswordReminderServiceTest {

    private static final int INTERVAL_DAYS = 120;
    private static final LocalDateTime CHANGED_AT = LocalDateTime.of(2026, 1, 1, 9, 0);

    @Test
    void isDue_respects120DayIntervalAndLastReminder() {
        assertEquals(INTERVAL_DAYS, new PasswordReminderProperties().getIntervalDays());

        User user = new User();
        user.setPasswordChangedAt(CHANGED_AT);

        assertFalse(PasswordReminderService.isDue(user, CHANGED_AT.plusDays(119), INTERVAL_DAYS));
        assertTrue(PasswordReminderService.isDue(user, CHANGED_AT.plusDays(120), INTERVAL_DAYS));

        LocalDateTime sentAt = CHANGED_AT.plusDays(120);
        user.setLastPasswordReminderSentAt(sentAt);
        assertFalse(PasswordReminderService.isDue(user, sentAt.plusDays(119), INTERVAL_DAYS));
        assertTrue(PasswordReminderService.isDue(user, sentAt.plusDays(120), INTERVAL_DAYS));
    }
}
