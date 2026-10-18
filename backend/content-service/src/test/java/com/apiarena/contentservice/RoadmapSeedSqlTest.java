package com.apiarena.contentservice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;

class RoadmapSeedSqlTest {

    private static final List<String> PHASES = List.of(
            "foundations", "the-arena", "competition", "community", "teachers", "trust-safety",
            "present-python", "multiplayer", "academy", "new-technologies", "mobile-app", "linkedin");

    @Test
    void seedIsIdempotentAndUsesNaturalKeys() throws Exception {
        String sql = Files.readString(Path.of("..", "..", "docker", "postgres", "seed-roadmap.sql"));
        assertTrue(sql.startsWith("-- Maintainer roadmap"));
        assertTrue(sql.contains("BEGIN;"));
        assertTrue(sql.trim().endsWith("COMMIT;"));
        int inserts = 0;
        for (String statement : sql.split(";")) {
            String trimmed = statement.trim();
            if (!trimmed.contains("INSERT INTO")) continue;
            inserts++;
            assertTrue(trimmed.contains("ON CONFLICT"), trimmed);
            assertTrue(!trimmed.contains("VALUES (1,") && !trimmed.contains("VALUES (1 "), trimmed);
        }
        assertEquals(150, inserts);
        assertEquals(12, count("INSERT INTO roadmap_phases ", sql));
        assertEquals(24, count("INSERT INTO roadmap_phase_translations ", sql));
        assertEquals(38, count("INSERT INTO roadmap_items ", sql));
        assertEquals(76, count("INSERT INTO roadmap_item_translations ", sql));
        for (String slug : PHASES) {
            assertTrue(sql.contains("'" + slug + "'"), slug);
        }
        assertTrue(sql.contains("'Centro de documentación y tours guiados'"));
        assertTrue(sql.contains("FALSE"));
        assertTrue(!sql.contains("machine_translated = true") && !sql.contains(", TRUE"));

        Set<String> applied = new LinkedHashSet<>();
        apply(sql, applied);
        int afterFirst = applied.size();
        apply(sql, applied);
        assertEquals(afterFirst, applied.size());
        assertEquals(inserts, afterFirst);

        String init = Files.readString(Path.of("..", "..", "docker", "postgres", "init-db.sql"));
        assertTrue(init.contains("INSERT INTO roadmap_phases"));
        assertTrue(init.contains("'Centro de documentación y tours guiados'"));
    }

    private static void apply(String sql, Set<String> applied) {
        Matcher matcher = Pattern.compile("INSERT INTO[\\s\\S]*?ON CONFLICT[\\s\\S]*?DO NOTHING").matcher(sql);
        while (matcher.find()) {
            applied.add(matcher.group().replaceAll("\\s+", " "));
        }
    }

    private static int count(String needle, String sql) {
        int n = 0;
        int from = 0;
        while (true) {
            int at = sql.indexOf(needle, from);
            if (at < 0) return n;
            n++;
            from = at + needle.length();
        }
    }
}
