package com.apiarena.notificationservice.model.entities;

import java.util.Arrays;
import java.util.List;

/**
 * Priority for in-app notifications (ascending: INFO is lowest, IMPORTANT highest).
 * Only {@link #IMPORTANT} is mirrored to email (same title/body) via auth-service → Resend.
 */
public enum NotificationImportance {

    INFO,
    REMINDER,
    ALERTS,
    IMPORTANT;

    /** Whether this level triggers an outbound email when the notification is created. */
    public boolean shouldSendEmailByDefault() {
        return this == IMPORTANT;
    }

    /**
     * All levels from {@code min} upward (inclusive), for filtering lists.
     */
    public static List<NotificationImportance> fromMinimum(NotificationImportance min) {
        if (min == null) {
            return List.of(values());
        }
        return Arrays.stream(values()).filter(i -> i.compareTo(min) >= 0).toList();
    }
}
