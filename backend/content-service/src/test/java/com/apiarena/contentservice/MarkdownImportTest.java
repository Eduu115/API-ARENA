package com.apiarena.contentservice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.apiarena.contentservice.markdown.MarkdownImport;

class MarkdownImportTest {

    @Test
    void readsOptionalFrontMatter() {
        MarkdownImport.Imported imported = MarkdownImport.parse("""
                ---
                title: Hello Arena
                version: 1.4.0
                tags: [release, api]
                ---
                Body **here**
                """);
        assertEquals("Hello Arena", imported.title());
        assertEquals("1.4.0", imported.version());
        assertEquals(List.of("release", "api"), imported.tags());
        assertEquals("Body **here**", imported.body());
    }

    @Test
    void titleFallsBackToFirstHeading() {
        MarkdownImport.Imported imported = MarkdownImport.parse("# Ship notes\n\nFixed login.");
        assertEquals("Ship notes", imported.title());
        assertNull(imported.version());
        assertEquals(List.of(), imported.tags());
    }
}
