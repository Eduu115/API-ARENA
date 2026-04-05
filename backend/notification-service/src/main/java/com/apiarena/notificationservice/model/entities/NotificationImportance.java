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
     * Whether this level should trigger email delivery when mirroring in-app notifications to email.
     * ALERTS and IMPORTANT are sent via Resend (auth-service); INFO and REMINDER are in-app only.
     */
    public boolean shouldSendEmailByDefault() {
        return this == ALERTS || this == IMPORTANT;
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
