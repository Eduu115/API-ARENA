package com.apiarena.contentservice.markdown;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Pulls fenced code, inline code and URLs out of markdown before translation
 * and puts the original bytes back afterwards. DeepL is told to ignore the
 * placeholder tags ({@code <x id="n"/>}).
 */
public final class MarkdownGuard {

    private static final Pattern FENCE = Pattern.compile("```[\\s\\S]*?```");
    private static final Pattern INLINE = Pattern.compile("`[^`\\n]+`");
    private static final Pattern URL = Pattern.compile("https?://[^\\s)<]+");

    private MarkdownGuard() {}

    public record Guarded(String text, List<String> slots) {}

    public static Guarded protect(String markdown) {
        List<String> slots = new ArrayList<>();
        String text = markdown == null ? "" : markdown;
        text = swap(FENCE, text, slots);
        text = swap(INLINE, text, slots);
        text = swap(URL, text, slots);
        return new Guarded(text, slots);
    }

    public static String restore(String translated, List<String> slots) {
        String out = translated == null ? "" : translated;
        for (int i = 0; i < slots.size(); i++) {
            String token = "<x id=\"" + i + "\"/>";
            String expanded = "<x id=\"" + i + "\"></x>";
            if (out.contains(token)) {
                out = out.replace(token, slots.get(i));
            } else if (out.contains(expanded)) {
                out = out.replace(expanded, slots.get(i));
            } else {
                throw new IllegalStateException("missing placeholder " + i);
            }
        }
        return out;
    }

    private static String swap(Pattern pattern, String text, List<String> slots) {
        Matcher matcher = pattern.matcher(text);
        StringBuilder sb = new StringBuilder();
        while (matcher.find()) {
            int id = slots.size();
            slots.add(matcher.group());
            matcher.appendReplacement(sb, Matcher.quoteReplacement("<x id=\"" + id + "\"/>"));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }
}
