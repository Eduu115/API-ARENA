package com.apiarena.socialservice.domain;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class FeedVisibilityTest {

    @Test
    void nonFriendSeesNothing() {
        assertFalse(FeedVisibility.canSeeActivity(1, 2, false, "FRIENDS"));
        assertFalse(FeedVisibility.canSeePost(1, 2, false));
    }

    @Test
    void friendsSeeActivityAndPosts() {
        assertTrue(FeedVisibility.canSeeActivity(1, 2, true, "FRIENDS"));
        assertTrue(FeedVisibility.canSeePost(1, 2, true));
    }

    @Test
    void privateHidesActivityIncludingTheAuthor() {
        assertFalse(FeedVisibility.canSeeActivity(2, 2, true, "PRIVATE"));
        assertFalse(FeedVisibility.canSeeActivity(1, 2, true, "PRIVATE"));
        assertTrue(FeedVisibility.canSeePost(1, 2, true));
        assertTrue(FeedVisibility.canSeePost(2, 2, false));
    }
}
