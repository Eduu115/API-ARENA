package com.apiarena.contentservice.model.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.apiarena.contentservice.markdown.MarkdownGuard;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

/**
 * Free endpoint when the key ends with {@code :fx}, otherwise the Pro endpoint.
 * Code fences, inline code and URLs are restored from placeholders. A failure
 * returns null so the caller can keep the source text.
 */
@Component
@Slf4j
public class DeepLClient implements MachineTranslator {

    private final String apiKey;
    private final DeepLTransport transport;
    private final ObjectMapper json = new ObjectMapper();

    @Autowired
    public DeepLClient(@Value("${deepl.api-key:}") String apiKey) {
        this(apiKey, (url, body, key) -> RestClient.create()
                .post()
                .uri(url)
                .header("Authorization", "DeepL-Auth-Key " + key)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class));
    }

    public DeepLClient(String apiKey, DeepLTransport transport) {
        this.apiKey = apiKey == null ? "" : apiKey;
        this.transport = transport;
    }

    @FunctionalInterface
    public interface DeepLTransport {
        String post(String url, String jsonBody, String apiKey);
    }

    @Override
    public List<String> translate(List<String> texts, String sourceLocale, String targetLocale) {
        if (apiKey.isBlank() || texts == null || texts.isEmpty()) return null;
        try {
            List<MarkdownGuard.Guarded> guarded = new ArrayList<>();
            List<String> payloadTexts = new ArrayList<>();
            for (String text : texts) {
                MarkdownGuard.Guarded slot = MarkdownGuard.protect(text == null ? "" : text);
                guarded.add(slot);
                payloadTexts.add(slot.text());
            }
            String body = json.writeValueAsString(Map.of(
                    "text", payloadTexts,
                    "source_lang", lang(sourceLocale),
                    "target_lang", lang(targetLocale),
                    "tag_handling", "xml",
                    "ignore_tags", List.of("x"),
                    "preserve_formatting", true,
                    "split_sentences", "0"
            ));
            String raw = transport.post(endpoint() + "/v2/translate", body, apiKey);
            if (raw == null || raw.isBlank()) return null;
            JsonNode translations = json.readTree(raw).path("translations");
            if (!translations.isArray() || translations.size() != guarded.size()) return null;
            List<String> out = new ArrayList<>();
            for (int i = 0; i < guarded.size(); i++) {
                out.add(MarkdownGuard.restore(translations.get(i).path("text").asText(""), guarded.get(i).slots()));
            }
            return out;
        } catch (RestClientException | IllegalStateException | java.io.IOException e) {
            log.warn("DeepL translation unavailable: {}", e.getClass().getSimpleName());
            return null;
        }
    }

    private String endpoint() {
        return apiKey.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
    }

    private static String lang(String locale) {
        return "es".equals(locale) ? "ES" : "EN";
    }
}
