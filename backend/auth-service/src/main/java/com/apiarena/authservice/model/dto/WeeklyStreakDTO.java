package com.apiarena.authservice.model.dto;

import java.time.Instant;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyStreakDTO {

    private int currentStreakWeeks;
    private int longestStreakWeeks;

    private int isoYear;
    private int isoWeek;
    /** ISO-8601 instant when the current ISO week ends (UTC). */
    private Instant weekEndsAt;

    private int xpEarnedThisWeek;
    private int xpTarget;

    private int qualifyingRunsThisWeek;
    private int qualifyingRunsTarget;
    private int qualifyingScoreMin;

    private boolean qualifiedThisWeek;
    private String qualifiedVia;

    /** Challenge IDs blocked for path B (used in prior 3 weeks). */
    private List<Long> blockedChallengeIds;
}
