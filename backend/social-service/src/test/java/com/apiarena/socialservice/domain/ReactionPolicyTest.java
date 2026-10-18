package com.apiarena.socialservice.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class ReactionPolicyTest {

    @Test
    void oneReactionPerUserToggles() {
        ReactionPolicy.Decision inserted = ReactionPolicy.toggle(null, "gg");
        assertEquals(ReactionPolicy.Action.INSERT, inserted.action());
        assertEquals("GG", inserted.reaction());

        ReactionPolicy.Decision replaced = ReactionPolicy.toggle("GG", "FIRE");
        assertEquals(ReactionPolicy.Action.UPDATE, replaced.action());
        assertEquals("FIRE", replaced.reaction());

        ReactionPolicy.Decision cleared = ReactionPolicy.toggle("FIRE", "fire");
        assertEquals(ReactionPolicy.Action.DELETE, cleared.action());
    }

    @Test
    void rejectsUnknownReaction() {
        assertThrows(IllegalArgumentException.class, () -> ReactionPolicy.toggle(null, "HEART"));
    }
}
