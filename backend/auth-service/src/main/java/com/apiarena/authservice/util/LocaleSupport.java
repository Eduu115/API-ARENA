package com.apiarena.authservice.util;

public final class LocaleSupport {

    private LocaleSupport() {
    }

    public static String normalize(String locale) {
        return "es".equalsIgnoreCase(locale != null ? locale.trim() : null) ? "es" : "en";
    }

    public static String fromAcceptLanguage(String acceptLanguage) {
        if (acceptLanguage == null || acceptLanguage.isBlank()) {
            return "en";
        }
        for (String part : acceptLanguage.split(",")) {
            String tag = part.split(";")[0].trim().toLowerCase();
            if (tag.startsWith("es")) {
                return "es";
            }
        }
        return "en";
    }
}
