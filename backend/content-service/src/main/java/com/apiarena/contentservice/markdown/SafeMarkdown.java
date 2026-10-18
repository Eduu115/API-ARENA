package com.apiarena.contentservice.markdown;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Renders a small markdown subset to HTML. Raw HTML in the source is escaped,
 * so script tags and event handlers cannot survive. Links and images only keep
 * http(s), mailto, or same-site paths.
 */
public final class SafeMarkdown {

    private SafeMarkdown() {}

    public static String toHtml(String markdown) {
        if (markdown == null || markdown.isEmpty()) return "";
        String normalized = markdown.replace("\r\n", "\n").replace('\r', '\n');
        String[] lines = normalized.split("\n", -1);
        StringBuilder html = new StringBuilder();
        int i = 0;
        while (i < lines.length) {
            String line = lines[i];
            if (line.startsWith("```")) {
                i++;
                StringBuilder code = new StringBuilder();
                while (i < lines.length && !lines[i].startsWith("```")) {
                    if (!code.isEmpty()) code.append('\n');
                    code.append(escape(lines[i]));
                    i++;
                }
                if (i < lines.length) i++;
                html.append("<pre><code>").append(code).append("</code></pre>\n");
                continue;
            }
            if (isTableStart(lines, i)) {
                i = appendTable(lines, i, html);
                continue;
            }
            if (line.startsWith(">")) {
                StringBuilder quote = new StringBuilder();
                while (i < lines.length && lines[i].startsWith(">")) {
                    if (!quote.isEmpty()) quote.append(' ');
                    quote.append(inline(lines[i].replaceFirst("^>\\s?", "")));
                    i++;
                }
                html.append("<blockquote><p>").append(quote).append("</p></blockquote>\n");
                continue;
            }
            if (line.startsWith("### ")) {
                html.append("<h3>").append(inline(line.substring(4))).append("</h3>\n");
                i++;
                continue;
            }
            if (line.startsWith("## ")) {
                html.append("<h2>").append(inline(line.substring(3))).append("</h2>\n");
                i++;
                continue;
            }
            if (line.startsWith("# ")) {
                html.append("<h1>").append(inline(line.substring(2))).append("</h1>\n");
                i++;
                continue;
            }
            if (isUl(line)) {
                html.append("<ul>");
                while (i < lines.length && isUl(lines[i])) {
                    html.append("<li>").append(inline(lines[i].replaceFirst("^[-*]\\s+", ""))).append("</li>");
                    i++;
                }
                html.append("</ul>\n");
                continue;
            }
            if (isOl(line)) {
                html.append("<ol>");
                while (i < lines.length && isOl(lines[i])) {
                    html.append("<li>").append(inline(lines[i].replaceFirst("^\\d+\\.\\s+", ""))).append("</li>");
                    i++;
                }
                html.append("</ol>\n");
                continue;
            }
            if (line.isBlank()) {
                i++;
                continue;
            }
            StringBuilder paragraph = new StringBuilder();
            while (i < lines.length && !lines[i].isBlank() && !isBlockStart(lines, i)) {
                if (!paragraph.isEmpty()) paragraph.append(' ');
                paragraph.append(inline(lines[i]));
                i++;
            }
            html.append("<p>").append(paragraph).append("</p>\n");
        }
        return html.toString();
    }

    static String inline(String raw) {
        StringBuilder out = new StringBuilder();
        int i = 0;
        while (i < raw.length()) {
            if (raw.charAt(i) == '`') {
                int end = raw.indexOf('`', i + 1);
                if (end > i) {
                    out.append("<code>").append(escape(raw.substring(i + 1, end))).append("</code>");
                    i = end + 1;
                    continue;
                }
            }
            if (raw.startsWith("![", i)) {
                int next = appendLink(raw, i, out, true);
                if (next > i) {
                    i = next;
                    continue;
                }
            }
            if (raw.charAt(i) == '[') {
                int next = appendLink(raw, i, out, false);
                if (next > i) {
                    i = next;
                    continue;
                }
            }
            if (raw.startsWith("**", i) || raw.startsWith("__", i)) {
                String mark = raw.substring(i, i + 2);
                int end = raw.indexOf(mark, i + 2);
                if (end > i) {
                    out.append("<strong>").append(inline(raw.substring(i + 2, end))).append("</strong>");
                    i = end + 2;
                    continue;
                }
            }
            if (raw.charAt(i) == '*' || (raw.charAt(i) == '_' && underscoreBoundary(raw, i))) {
                char mark = raw.charAt(i);
                int end = raw.indexOf(mark, i + 1);
                if (end > i + 1 && (mark != '_' || end + 1 == raw.length() || !Character.isLetterOrDigit(raw.charAt(end + 1)))) {
                    out.append("<em>").append(inline(raw.substring(i + 1, end))).append("</em>");
                    i = end + 1;
                    continue;
                }
            }
            out.append(escape(String.valueOf(raw.charAt(i))));
            i++;
        }
        return out.toString();
    }

    private static boolean underscoreBoundary(String raw, int i) {
        return i == 0 || !Character.isLetterOrDigit(raw.charAt(i - 1));
    }

    private static int appendLink(String raw, int i, StringBuilder out, boolean image) {
        int labelStart = image ? i + 2 : i + 1;
        int close = raw.indexOf(']', labelStart);
        if (close < 0 || close + 1 >= raw.length() || raw.charAt(close + 1) != '(') return i;
        int urlEnd = matchingParen(raw, close + 1);
        if (urlEnd < 0) return i;
        String label = raw.substring(labelStart, close);
        String url = raw.substring(close + 2, urlEnd).trim();
        String safe = safeUrl(url);
        if (image) {
            if (safe == null) {
                out.append(escape(label));
            } else {
                out.append("<img src=\"").append(safe).append("\" alt=\"").append(escape(label)).append("\">");
            }
        } else if (safe == null) {
            out.append(escape(label));
        } else {
            out.append("<a href=\"").append(safe).append("\" rel=\"noopener noreferrer\">")
                    .append(inline(label)).append("</a>");
        }
        return urlEnd + 1;
    }

    /** `open` points at the '(' that starts the URL. */
    private static int matchingParen(String raw, int open) {
        int depth = 0;
        for (int j = open; j < raw.length(); j++) {
            char c = raw.charAt(j);
            if (c == '(') depth++;
            else if (c == ')') {
                depth--;
                if (depth == 0) return j;
            }
        }
        return -1;
    }

    public static String safeUrl(String url) {
        if (url == null) return null;
        String trimmed = url.trim();
        String lower = trimmed.toLowerCase(Locale.ROOT);
        if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
            return null;
        }
        boolean ok = lower.startsWith("https://") || lower.startsWith("http://") || lower.startsWith("mailto:")
                || (trimmed.startsWith("/") && !trimmed.startsWith("//"));
        if (!ok) return null;
        if (trimmed.indexOf('"') >= 0 || trimmed.indexOf('<') >= 0 || trimmed.indexOf('>') >= 0
                || trimmed.indexOf(' ') >= 0 || trimmed.indexOf('\'') >= 0) {
            return null;
        }
        return escape(trimmed);
    }

    static String escape(String value) {
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private static boolean isUl(String line) {
        return line.startsWith("- ") || line.startsWith("* ");
    }

    private static boolean isOl(String line) {
        return line.matches("^\\d+\\.\\s+.*");
    }

    private static boolean isBlockStart(String[] lines, int i) {
        String line = lines[i];
        return line.startsWith("```") || line.startsWith(">") || line.startsWith("#")
                || isUl(line) || isOl(line) || isTableStart(lines, i);
    }

    private static boolean isTableStart(String[] lines, int i) {
        if (i + 1 >= lines.length || !lines[i].contains("|")) return false;
        return isSeparator(lines[i + 1]);
    }

    private static boolean isSeparator(String line) {
        String trimmed = line.trim();
        if (!trimmed.contains("-")) return false;
        for (int i = 0; i < trimmed.length(); i++) {
            char c = trimmed.charAt(i);
            if (c != '|' && c != '-' && c != ':' && c != ' ') return false;
        }
        return true;
    }

    private static int appendTable(String[] lines, int i, StringBuilder html) {
        List<String> header = cells(lines[i]);
        i += 2;
        html.append("<table><thead><tr>");
        for (String cell : header) {
            html.append("<th>").append(inline(cell)).append("</th>");
        }
        html.append("</tr></thead><tbody>");
        while (i < lines.length && lines[i].contains("|") && !lines[i].isBlank() && !isSeparator(lines[i])) {
            html.append("<tr>");
            for (String cell : cells(lines[i])) {
                html.append("<td>").append(inline(cell)).append("</td>");
            }
            html.append("</tr>");
            i++;
        }
        html.append("</tbody></table>\n");
        return i;
    }

    private static List<String> cells(String line) {
        String trimmed = line.trim();
        if (trimmed.startsWith("|")) trimmed = trimmed.substring(1);
        if (trimmed.endsWith("|")) trimmed = trimmed.substring(0, trimmed.length() - 1);
        List<String> cells = new ArrayList<>();
        for (String part : trimmed.split("\\|", -1)) {
            cells.add(part.trim());
        }
        return cells;
    }
}
