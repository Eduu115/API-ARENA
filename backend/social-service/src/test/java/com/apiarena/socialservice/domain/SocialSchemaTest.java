package com.apiarena.socialservice.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;

class SocialSchemaTest {

    @Test
    void reactionsAreUniquePerUserAndTarget() throws Exception {
        Path sql = Path.of("..", "..", "docker", "postgres", "create-social-beta.sql");
        String text = Files.readString(sql);
        assertTrue(text.contains("CONSTRAINT uq_social_reaction_user UNIQUE (target_type, target_id, user_id)"));
        assertTrue(text.contains("idx_social_activity_user_created"));
        assertTrue(text.contains("idx_social_posts_user_created"));
        assertTrue(!text.toLowerCase().contains("jsonb"), "social tables stay relational");
    }

    @Test
    void submissionPlansAreIdempotentIds() {
        var first = SubmissionActivityPlanner.plan(9, 800, false, null);
        assertEquals(2, first.size());
        assertEquals("submission:9:completed", first.get(0).sourceEventId());
        assertEquals("submission:9:first-clear", first.get(1).sourceEventId());

        var again = SubmissionActivityPlanner.plan(9, 900, true, 800);
        assertEquals("submission:9:personal-best", again.get(1).sourceEventId());
        assertEquals(800, again.get(1).previousScore());
    }
}
