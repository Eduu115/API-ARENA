package com.apiarena.contentservice.markdown;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Optional front matter: title, version, tags. Anything else stays in the body. */
public final class MarkdownImport {

    private MarkdownImport() {}

    public record Imported(String title, String version, List<String> tags, String body) {}

    public static Imported parse(String raw) {
        String text = raw == null ? "" : raw.replace("\r\n", "\n").replace('\r', '\n');
        String title = null;
        String version = null;
        List<String> tags = new ArrayList<>();
        String body = text;
        if (text.startsWith("---\n") || text.equals("---")) {
            int end = text.indexOf("\n---", 3);
            if (end > 0) {
                String front = text.substring(4, end);
                body = text.substring(end + 4).replaceFirst("^\\n", "");
                for (String line : front.split("\n")) {
                    int colon = line.indexOf(':');
                    if (colon < 1) continue;
                    String key = line.substring(0, colon).trim().toLowerCase(Locale.ROOT);
                    String value = line.substring(colon + 1).trim();
                    switch (key) {
                        case "title" -> title = unquote(value);
                        case "version", "version_label" -> version = unquote(value);
                        case "tags" -> tags = parseTags(value);
                        default -> { }
                    }
                }
            }
        }
        if (title == null || title.isBlank()) {
            for (String line : body.split("\n")) {
                if (line.startsWith("# ")) {
                    title = line.substring(2).trim();
                    break;
                }
            }
        }
        if (title == null || title.isBlank()) title = "Untitled";
        return new Imported(title, blankToNull(version), List.copyOf(tags), body.strip());
    }

    private static List<String> parseTags(String value) {
        String raw = value.trim();
        if (raw.startsWith("[") && raw.endsWith("]")) {
            raw = raw.substring(1, raw.length() - 1);
        }
        List<String> tags = new ArrayList<>();
        for (String part : raw.split(",")) {
            String tag = unquote(part.trim()).toLowerCase(Locale.ROOT);
            if (!tag.isBlank() && !tags.contains(tag)) tags.add(tag);
        }
        return tags;
    }

    private static String unquote(String value) {
        if (value.length() >= 2) {
            char a = value.charAt(0);
            char b = value.charAt(value.length() - 1);
            if ((a == '"' && b == '"') || (a == '\'' && b == '\'')) {
                return value.substring(1, value.length() - 1);
            }
        }
        return value;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
