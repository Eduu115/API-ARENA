package com.apiarena.socialservice.domain;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

public final class FeedCursor {

    public record Point(Instant at, long id, String kind) {
    }

    private FeedCursor() {
    }

    public static String encode(Instant at, long id, String kind) {
        String raw = at.toEpochMilli() + ":" + id + ":" + kind;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    public static Point decode(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }
        try {
            String raw = new String(Base64.getUrlDecoder().decode(cursor.trim()), StandardCharsets.UTF_8);
            String[] parts = raw.split(":");
            if (parts.length != 3) {
                return null;
            }
            return new Point(Instant.ofEpochMilli(Long.parseLong(parts[0])), Long.parseLong(parts[1]), parts[2]);
        } catch (Exception e) {
            return null;
        }
    }

    /** True when the row is strictly older than the cursor in (time desc, id desc) order. */
    public static boolean afterCursor(Point cursor, Instant at, long id) {
        if (cursor == null || at == null) {
            return true;
        }
        int cmp = at.compareTo(cursor.at());
        if (cmp < 0) {
            return true;
        }
        return cmp == 0 && id < cursor.id();
    }
}
