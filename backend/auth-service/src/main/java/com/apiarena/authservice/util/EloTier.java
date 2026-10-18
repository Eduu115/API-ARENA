package com.apiarena.authservice.util;

/** Rating bands used for social tier-up activity. Thresholds are inclusive on the lower edge. */
public final class EloTier {

    private EloTier() {
    }

    public static String of(int rating) {
        if (rating < 1000) {
            return "IRON";
        }
        if (rating < 1200) {
            return "BRONZE";
        }
        if (rating < 1400) {
            return "SILVER";
        }
        if (rating < 1600) {
            return "GOLD";
        }
        if (rating < 1800) {
            return "PLATINUM";
        }
        if (rating < 2000) {
            return "DIAMOND";
        }
        return "MASTER";
    }
}
