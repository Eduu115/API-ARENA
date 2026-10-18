package com.apiarena.socialservice.domain;

import java.util.ArrayList;
import java.util.List;

/** Which automatic rows a completed submission should produce. Idempotent via source event ids. */
public final class SubmissionActivityPlanner {

    public static final String COMPLETED = "CHALLENGE_COMPLETED";
    public static final String FIRST_CLEAR = "FIRST_CLEAR";
    public static final String PERSONAL_BEST = "PERSONAL_BEST";

    public record Planned(String activityType, String sourceEventId, Integer score, Integer previousScore) {
    }

    private SubmissionActivityPlanner() {
    }

    public static List<Planned> plan(long submissionId, Integer score, boolean hadPriorCompletion, Integer previousBest) {
        List<Planned> out = new ArrayList<>(3);
        String base = "submission:" + submissionId;
        out.add(new Planned(COMPLETED, base + ":completed", score, null));
        if (!hadPriorCompletion) {
            out.add(new Planned(FIRST_CLEAR, base + ":first-clear", score, null));
        } else if (score != null && previousBest != null && score > previousBest) {
            out.add(new Planned(PERSONAL_BEST, base + ":personal-best", score, previousBest));
        }
        return out;
    }
}
