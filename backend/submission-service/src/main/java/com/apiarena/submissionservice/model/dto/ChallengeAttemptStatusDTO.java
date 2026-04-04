package com.apiarena.submissionservice.model.dto;

/**
 * Política de intentos por challenge: cooldown = time_limit_minutes desde el último inicio;
 * máximo 3 envíos por día natural (UTC) por usuario y challenge.
 */
public record ChallengeAttemptStatusDTO(
        boolean allowed,
        int attemptsUsedToday,
        int maxAttemptsPerDay,
        String blockReason,
        String cooldownUntilIso,
        String dailyLimitResetsAtIso
) {
    public static final String REASON_COOLDOWN = "COOLDOWN";
    public static final String REASON_DAILY_LIMIT = "DAILY_LIMIT";

    public static ChallengeAttemptStatusDTO allowed(int used, int max) {
        return new ChallengeAttemptStatusDTO(true, used, max, null, null, null);
    }

    public static ChallengeAttemptStatusDTO blockedCooldown(int used, int max, String cooldownUntilIso) {
        return new ChallengeAttemptStatusDTO(false, used, max, REASON_COOLDOWN, cooldownUntilIso, null);
    }

    public static ChallengeAttemptStatusDTO blockedDaily(int used, int max, String dailyLimitResetsAtIso) {
        return new ChallengeAttemptStatusDTO(false, used, max, REASON_DAILY_LIMIT, null, dailyLimitResetsAtIso);
    }
}
