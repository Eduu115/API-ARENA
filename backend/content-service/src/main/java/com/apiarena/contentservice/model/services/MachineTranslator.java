package com.apiarena.contentservice.model.services;

import java.util.List;

/**
 * Returns null when translation is unavailable. Callers keep the text already
 * written and surface a warning. Never throws for a missing key or a provider error.
 */
public interface MachineTranslator {
    List<String> translate(List<String> texts, String sourceLocale, String targetLocale);
}
