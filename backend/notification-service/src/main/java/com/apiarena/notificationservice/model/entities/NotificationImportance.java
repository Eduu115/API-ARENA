package com.apiarena.notificationservice.model.entities;

import java.util.Arrays;
import java.util.List;

/**
 * Priority for in-app notifications (ascending: INFO is lowest, IMPORTANT highest).
 * Future outbound email can target only {@link #IMPORTANT} (or {@link #shouldSendEmailByDefault()}).
 */
public enum NotificationImportance {

    INFO,
    REMINDER,
    ALERTS,
    IMPORTANT;

    /**
     * Whether this level should trigger email delivery when email notifications are enabled.
     * Today only IMPORTANT; adjust policy here as product rules evolve.
     */
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
