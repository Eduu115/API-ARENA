package com.apiarena.socialservice.domain;

/**
 * Who can see a feed row. Friendships are decided by the caller.
 * PRIVATE hides activity from everyone, including the author. Posts stay visible to the author and to friends.
 */
public final class FeedVisibility {

    public static final String FRIENDS = "FRIENDS";
    public static final String PRIVATE = "PRIVATE";

    private FeedVisibility() {
    }

    public static String normalize(String raw) {
        if (raw != null && PRIVATE.equalsIgnoreCase(raw.trim())) {
            return PRIVATE;
        }
        return FRIENDS;
    }

    public static boolean canSeeActivity(long viewerId, long authorId, boolean friends, String visibility) {
        if (PRIVATE.equals(normalize(visibility))) {
            return false;
        }
        return viewerId == authorId || friends;
    }

    public static boolean canSeePost(long viewerId, long authorId, boolean friends) {
        return viewerId == authorId || friends;
    }
}
