package com.apiarena.contentservice.model.services;

import java.util.List;

import org.springframework.stereotype.Component;

/**
 * Keeps the source text when no translator is configured. DeepLClient replaces
 * this bean once it is added.
 */
@Component
public class SourceOnlyTranslator implements MachineTranslator {

    @Override
    public List<String> translate(List<String> texts, String sourceLocale, String targetLocale) {
        return null;
    }
}
