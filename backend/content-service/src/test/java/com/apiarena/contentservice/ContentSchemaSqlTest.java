package com.apiarena.contentservice;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;

class ContentSchemaSqlTest {

    @Test
    void alterIsTransactionalAndIdempotent() throws Exception {
        String sql = Files.readString(Path.of("..", "..", "docker", "postgres", "alter-content.sql"));
        assertTrue(sql.contains("BEGIN;"));
        assertTrue(sql.contains("COMMIT;"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS content_posts"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS content_post_translations"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS content_tags"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS content_post_tags"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS roadmap_phases"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS roadmap_phase_translations"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS roadmap_items"));
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS roadmap_item_translations"));
        assertTrue(sql.contains("CHECK (type IN ('NEWS', 'CHANGELOG'))"));
        assertTrue(sql.contains("CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))"));
        assertTrue(sql.contains("CHECK (status IN ('DONE', 'IN_PROGRESS', 'PLANNED'))"));
        assertTrue(sql.contains("UNIQUE (post_id, locale)"));
        assertTrue(sql.contains("UNIQUE (phase_id, slug)"));
        assertTrue(sql.contains("PRIMARY KEY (phase_id, locale)"));
        assertTrue(sql.contains("PRIMARY KEY (item_id, locale)"));
        assertFalse(sql.contains("CREATE TYPE"));
        assertFalse(sql.contains("title_en"));
        assertFalse(sql.contains("title_es"));
        String init = Files.readString(Path.of("..", "..", "docker", "postgres", "init-db.sql"));
        assertTrue(init.contains("CREATE TABLE IF NOT EXISTS content_posts"));
        assertTrue(init.contains("CREATE TABLE IF NOT EXISTS roadmap_item_translations"));
    }
}
