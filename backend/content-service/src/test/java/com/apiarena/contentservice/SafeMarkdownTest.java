package com.apiarena.contentservice;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import com.apiarena.contentservice.markdown.SafeMarkdown;

class SafeMarkdownTest {

    @Test
    void escapesRawHtmlAndDropsScriptableLinks() {
        String html = SafeMarkdown.toHtml("""
                <script>alert(1)</script>
                <img src=x onerror="alert(1)">
                [click](javascript:alert(1))
                [ok](https://apiarena.net/en/news)
                ![x](javascript:alert(1))
                ![cover](https://cdn.apiarena.net/a.png)
                """);
        String lower = html.toLowerCase();
        assertFalse(lower.contains("<script"), html);
        assertFalse(html.contains("<img src=x"), html);
        assertFalse(lower.contains("javascript:"), html);
        assertTrue(lower.contains("&lt;script&gt;"), html);
        assertTrue(lower.contains("&lt;img"), html);
        assertTrue(html.contains("href=\"https://apiarena.net/en/news\""));
        assertTrue(html.contains("src=\"https://cdn.apiarena.net/a.png\""));
        assertTrue(html.contains("&lt;script&gt;"));
    }

    @Test
    void rendersToolbarSubset() {
        String html = SafeMarkdown.toHtml("""
                # Title
                **bold** and *italic*
                - one
                1. two
                > quoted
                `code`
                ```
                int x = 1;
                ```
                | A | B |
                | --- | --- |
                | 1 | 2 |
                """);
        assertTrue(html.contains("<h1>Title</h1>"));
        assertTrue(html.contains("<strong>bold</strong>"));
        assertTrue(html.contains("<em>italic</em>"));
        assertTrue(html.contains("<ul><li>one</li></ul>"));
        assertTrue(html.contains("<ol><li>two</li></ol>"));
        assertTrue(html.contains("<blockquote>"));
        assertTrue(html.contains("<code>code</code>"));
        assertTrue(html.contains("<pre><code>int x = 1;</code></pre>"));
        assertTrue(html.contains("<th>A</th>"));
        assertTrue(html.contains("<td>1</td>"));
    }
}
