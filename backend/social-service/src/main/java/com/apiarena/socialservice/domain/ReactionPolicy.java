package com.apiarena.socialservice.domain;

/** One reaction per user per target. The same reaction again clears it; a different one replaces it. */
public final class ReactionPolicy {

    public enum Action { INSERT, UPDATE, DELETE }

    public record Decision(Action action, String reaction) {
    }

    private ReactionPolicy() {
    }

    public static Decision toggle(String existingReaction, String requested) {
        String next = Reactions.reaction(requested);
        if (next == null) {
            throw new IllegalArgumentException("Unknown reaction");
        }
        if (existingReaction == null) {
            return new Decision(Action.INSERT, next);
        }
        if (existingReaction.equals(next)) {
            return new Decision(Action.DELETE, next);
        }
        return new Decision(Action.UPDATE, next);
    }
}
