package com.apiarena.authservice.model.services;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.authservice.model.dto.WeeklyStreakDTO;
import com.apiarena.authservice.model.entities.UserStreakState;
import com.apiarena.authservice.model.entities.UserWeeklyProgress;
import com.apiarena.authservice.model.entities.UserWeeklyStreakChallenge;
import com.apiarena.authservice.repository.UserStreakStateRepository;
import com.apiarena.authservice.repository.UserWeeklyProgressRepository;
import com.apiarena.authservice.repository.UserWeeklyStreakChallengeRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WeeklyStreakService {

    public static final int WEEKLY_XP_TARGET = 120;
    public static final int WEEKLY_QUALIFYING_SCORE = 650;
    public static final int WEEKLY_QUALIFYING_RUNS = 3;
    public static final int LOOKBACK_WEEKS = 3;

    private final UserStreakStateRepository streakStateRepository;
    private final UserWeeklyProgressRepository progressRepository;
    private final UserWeeklyStreakChallengeRepository streakChallengeRepository;
    private final AchievementService achievementService;

    @Transactional
    public void recordActivity(Long userId, int xpEarned, Long challengeId, Integer pipelineTotalScore) {
        if (userId == null) {
            return;
        }
        IsoWeek current = IsoWeek.nowUtc();
        UserStreakState state = loadOrCreateState(userId);
        processPastWeeks(state, current);

        UserWeeklyProgress progress = progressRepository
                .findByUserIdAndIsoYearAndIsoWeek(userId, current.year(), current.week())
                .orElseGet(() -> progressRepository.save(new UserWeeklyProgress(userId, current.year(), current.week())));

        if (xpEarned > 0) {
            progress.setXpEarned(progress.getXpEarned() + xpEarned);
        }

        if (challengeId != null && pipelineTotalScore != null && pipelineTotalScore >= WEEKLY_QUALIFYING_SCORE) {
            maybeRecordQualifyingChallenge(userId, current, challengeId, progress);
        }

        boolean wasQualified = progress.isQualified();
        reevaluateQualification(progress);
        progressRepository.save(progress);

        if (progress.isQualified()) {
            applyQualificationToStreak(state, current);
        } else if (wasQualified && !progress.isQualified()) {
            // Should not happen in normal flow; keep streak state unchanged until week closes.
        }

        streakStateRepository.save(state);
        if (progress.isQualified()) {
            achievementService.tryGrantWeeklyStreakAchievements(userId, state.getCurrentStreakWeeks());
        }
    }

    @Transactional
    public WeeklyStreakDTO getStreakForUser(Long userId) {
        IsoWeek current = IsoWeek.nowUtc();
        UserStreakState state = streakStateRepository.findByUserId(userId).orElseGet(() -> {
            UserStreakState s = new UserStreakState(userId);
            s.setLastProcessedIsoYear(current.previous().year());
            s.setLastProcessedIsoWeek(current.previous().week());
            return s;
        });
        processPastWeeks(state, current);
        streakStateRepository.save(state);

        UserWeeklyProgress progress = progressRepository
                .findByUserIdAndIsoYearAndIsoWeek(userId, current.year(), current.week())
                .orElseGet(() -> new UserWeeklyProgress(userId, current.year(), current.week()));

        List<Long> blocked = loadBlockedChallengeIds(userId, current);

        return WeeklyStreakDTO.builder()
                .currentStreakWeeks(state.getCurrentStreakWeeks())
                .longestStreakWeeks(state.getLongestStreakWeeks())
                .isoYear(current.year())
                .isoWeek(current.week())
                .weekEndsAt(current.weekEndsAtExclusive())
                .xpEarnedThisWeek(progress.getXpEarned())
                .xpTarget(WEEKLY_XP_TARGET)
                .qualifyingRunsThisWeek(progress.getQualifyingDistinctCount())
                .qualifyingRunsTarget(WEEKLY_QUALIFYING_RUNS)
                .qualifyingScoreMin(WEEKLY_QUALIFYING_SCORE)
                .qualifiedThisWeek(progress.isQualified())
                .qualifiedVia(progress.getQualifiedVia())
                .blockedChallengeIds(blocked)
                .build();
    }

    @Transactional(readOnly = true)
    public Optional<UserStreakState> findState(Long userId) {
        return streakStateRepository.findByUserId(userId);
    }

    private UserStreakState loadOrCreateState(Long userId) {
        return streakStateRepository.findByUserId(userId).orElseGet(() -> {
            UserStreakState state = new UserStreakState(userId);
            IsoWeek current = IsoWeek.nowUtc();
            IsoWeek prev = current.previous();
            state.setLastProcessedIsoYear(prev.year());
            state.setLastProcessedIsoWeek(prev.week());
            return streakStateRepository.save(state);
        });
    }

    private void processPastWeeks(UserStreakState state, IsoWeek current) {
        IsoWeek prevWeek = current.previous();
        if (state.getLastProcessedIsoYear() == null || state.getLastProcessedIsoWeek() == null) {
            state.setLastProcessedIsoYear(prevWeek.year());
            state.setLastProcessedIsoWeek(prevWeek.week());
            return;
        }

        IsoWeek lastProcessed = new IsoWeek(state.getLastProcessedIsoYear(), state.getLastProcessedIsoWeek());
        IsoWeek cursor = lastProcessed.next();
        while (!cursor.isAfter(prevWeek)) {
            finalizeWeek(state, cursor);
            cursor = cursor.next();
        }
        state.setLastProcessedIsoYear(prevWeek.year());
        state.setLastProcessedIsoWeek(prevWeek.week());
    }

    private void finalizeWeek(UserStreakState state, IsoWeek week) {
        Optional<UserWeeklyProgress> progressOpt = progressRepository.findByUserIdAndIsoYearAndIsoWeek(
                state.getUserId(), week.year(), week.week());
        if (progressOpt.isEmpty() || !progressOpt.get().isQualified()) {
            state.setCurrentStreakWeeks(0);
        }
    }

    private void maybeRecordQualifyingChallenge(
            Long userId, IsoWeek current, Long challengeId, UserWeeklyProgress progress) {
        if (streakChallengeRepository.existsByUserIdAndIsoYearAndIsoWeekAndChallengeId(
                userId, current.year(), current.week(), challengeId)) {
            return;
        }
        List<Integer> lookbackKeys = lookbackYearWeekKeys(current);
        List<Long> blocked = streakChallengeRepository.findChallengeIdsByUserIdAndYearWeekKeys(userId, lookbackKeys);
        if (blocked.contains(challengeId)) {
            return;
        }
        streakChallengeRepository.save(new UserWeeklyStreakChallenge(userId, current.year(), current.week(), challengeId));
        progress.setQualifyingDistinctCount(progress.getQualifyingDistinctCount() + 1);
    }

    private List<Integer> lookbackYearWeekKeys(IsoWeek current) {
        List<Integer> keys = new ArrayList<>(LOOKBACK_WEEKS);
        IsoWeek cursor = current;
        for (int i = 0; i < LOOKBACK_WEEKS; i++) {
            cursor = cursor.previous();
            keys.add(cursor.yearWeekKey());
        }
        return keys;
    }

    private List<Long> loadBlockedChallengeIds(Long userId, IsoWeek current) {
        return streakChallengeRepository.findChallengeIdsByUserIdAndYearWeekKeys(
                userId, lookbackYearWeekKeys(current));
    }

    private void reevaluateQualification(UserWeeklyProgress progress) {
        boolean viaXp = progress.getXpEarned() >= WEEKLY_XP_TARGET;
        boolean viaRuns = progress.getQualifyingDistinctCount() >= WEEKLY_QUALIFYING_RUNS;
        if (!viaXp && !viaRuns) {
            return;
        }
        progress.setQualified(true);
        if (viaXp && viaRuns) {
            progress.setQualifiedVia("BOTH");
        } else if (viaXp) {
            progress.setQualifiedVia("XP");
        } else {
            progress.setQualifiedVia("RUNS");
        }
    }

    private void applyQualificationToStreak(UserStreakState state, IsoWeek week) {
        Integer ly = state.getLastQualifiedIsoYear();
        Integer lw = state.getLastQualifiedIsoWeek();
        if (ly != null && lw != null && sameWeek(ly, lw, week.year(), week.week())) {
            return;
        }
        IsoWeek previous = week.previous();
        if (ly != null && lw != null && sameWeek(ly, lw, previous.year(), previous.week())) {
            state.setCurrentStreakWeeks(state.getCurrentStreakWeeks() + 1);
        } else {
            state.setCurrentStreakWeeks(1);
        }
        state.setLastQualifiedIsoYear(week.year());
        state.setLastQualifiedIsoWeek(week.week());
        state.setLongestStreakWeeks(Math.max(state.getLongestStreakWeeks(), state.getCurrentStreakWeeks()));
    }

    private static boolean sameWeek(int y1, int w1, int y2, int w2) {
        return y1 == y2 && w1 == w2;
    }

    /** ISO week in UTC. */
    static final class IsoWeek {
        private final int year;
        private final int week;

        IsoWeek(int year, int week) {
            this.year = year;
            this.week = week;
        }

        int year() {
            return year;
        }

        int week() {
            return week;
        }

        int yearWeekKey() {
            return year * 100 + week;
        }

        static IsoWeek nowUtc() {
            return fromLocalDate(LocalDate.now(ZoneOffset.UTC));
        }

        static IsoWeek fromLocalDate(LocalDate date) {
            WeekFields wf = WeekFields.ISO;
            return new IsoWeek(date.get(wf.weekBasedYear()), date.get(wf.weekOfWeekBasedYear()));
        }

        LocalDate monday() {
            return LocalDate.of(year, 1, 4)
                    .with(WeekFields.ISO.weekBasedYear(), year)
                    .with(WeekFields.ISO.weekOfWeekBasedYear(), week)
                    .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        }

        IsoWeek previous() {
            return fromLocalDate(monday().minusWeeks(1));
        }

        IsoWeek next() {
            return fromLocalDate(monday().plusWeeks(1));
        }

        boolean isAfter(IsoWeek other) {
            return yearWeekKey() > other.yearWeekKey();
        }

        Instant weekEndsAtExclusive() {
            LocalDate sunday = monday().with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
            return sunday.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        }
    }
}
