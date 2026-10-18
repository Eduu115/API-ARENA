package com.apiarena.contentservice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;

import com.apiarena.contentservice.model.services.DeepLClient;

class DeepLClientTest {

    @Test
    void successTranslatesAndRestoresMarkdown() {
        AtomicReference<String> sent = new AtomicReference<>();
        DeepLClient client = new DeepLClient("test:fx", (url, body, key) -> {
            sent.set(url + "\n" + body);
            assertTrue(url.startsWith("https://api-free.deepl.com"));
            return """
                    {"translations":[{"text":"Hola <x id=\\"0\\"/> visita <x id=\\"1\\"/>"}]}
                    """;
        });
        String source = "Hello ```\nSECRET_CODE\n``` visit https://apiarena.net/docs";
        List<String> out = client.translate(List.of(source), "en", "es");
        assertEquals(List.of("Hola ```\nSECRET_CODE\n``` visita https://apiarena.net/docs"), out);
        assertFalse(sent.get().contains("SECRET_CODE"));
        assertFalse(sent.get().contains("https://apiarena.net/docs"));
        assertTrue(sent.get().contains("<x id=\\\"0\\\"/>") || sent.get().contains("<x id=\"0\"/>"));
    }

    @Test
    void failureKeepsCallerInControl() {
        DeepLClient client = new DeepLClient("pro-key", (url, body, key) -> {
            throw new IllegalStateException("deepl down");
        });
        assertTrue(client.translate(List.of("Hello"), "en", "es") == null);
        assertTrue(new DeepLClient("", (url, body, key) -> "nope").translate(List.of("Hello"), "en", "es") == null);
    }

    @Test
    void proKeyUsesProHost() {
        AtomicReference<String> url = new AtomicReference<>();
        DeepLClient client = new DeepLClient("pro-key", (endpoint, body, key) -> {
            url.set(endpoint);
            return "{\"translations\":[{\"text\":\"Hola\"}]}";
        });
        assertEquals(List.of("Hola"), client.translate(List.of("Hello"), "en", "es"));
        assertTrue(url.get().startsWith("https://api.deepl.com"));
        assertNull(new DeepLClient("   ", (a, b, c) -> "x").translate(List.of("Hello"), "es", "en"));
    }
}
