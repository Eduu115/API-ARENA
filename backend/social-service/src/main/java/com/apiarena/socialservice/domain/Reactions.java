package com.apiarena.socialservice.domain;

import java.util.Set;

public final class Reactions {

    public static final Set<String> ALLOWED = Set.of("GG", "FIRE", "CLAP", "ROCKET", "EYES");

    public static final String ACTIVITY = "ACTIVITY";
    public static final String POST = "POST";

    private Reactions() {
    }

    public static String reaction(String raw) {
        if (raw == null) {
            return null;
        }
        String v = raw.trim().toUpperCase();
        return ALLOWED.contains(v) ? v : null;
    }

    public static String targetType(String raw) {
        if (raw == null) {
            return null;
        }
        String v = raw.trim().toUpperCase();
        if (ACTIVITY.equals(v) || POST.equals(v)) {
            return v;
        }
        return null;
    }
}
