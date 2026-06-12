package com.apiarena.authservice.model.services;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.authservice.model.dto.AchievementDTO;
import com.apiarena.authservice.model.entities.AchievementDefinition;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.model.entities.UserAchievement;
import com.apiarena.authservice.repository.AchievementDefinitionRepository;
import com.apiarena.authservice.repository.UserAchievementRepository;
import com.apiarena.authservice.repository.UserRepository;

@Service
public class AchievementService {

    /** Accounts created before this instant count as the closed “alpha” cohort. */
    private static final LocalDateTime ALPHA_SEASON_END = LocalDateTime.of(2026, 7, 1, 0, 0, 0);

    private final UserRepository userRepository;
    private final AchievementDefinitionRepository definitionRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final AchievementNotificationDispatchService achievementNotificationDispatchService;

    public AchievementService(
            UserRepository userRepository,
            AchievementDefinitionRepository definitionRepository,
            UserAchievementRepository userAchievementRepository,
            AchievementNotificationDispatchService achievementNotificationDispatchService) {
        this.userRepository = userRepository;
        this.definitionRepository = definitionRepository;
        this.userAchievementRepository = userAchievementRepository;
        this.achievementNotificationDispatchService = achievementNotificationDispatchService;
    }

    @Transactional
    public void syncForUserId(Long userId) {
        if (userId == null) {
            return;
        }
        userRepository.findById(userId).ifPresent(this::syncAchievements);
    }

    @Transactional
    public List<AchievementDTO> listForCurrentUserEmail(String email) {
        User user = userRepository.findByEmailIgnoreCase(email.trim()).orElseThrow();
        syncAchievements(user);
        List<AchievementDefinition> defs = definitionRepository.findAllByOrderBySortOrderAsc();
        List<AchievementDTO> out = new ArrayList<>(defs.size());
        for (AchievementDefinition def : defs) {
            var ua = userAchievementRepository.findByUser_IdAndAchievement_Id(user.getId(), def.getId());
            boolean unlocked = ua.isPresent();
            out.add(AchievementDTO.builder()
                    .code(def.getCode())
                    .title(def.getTitle())
                    .description(def.getDescription())
                    .iconKey(def.getIconKey())
                    .tier(def.getTier())
                    .sortOrder(def.getSortOrder() != null ? def.getSortOrder() : 0)
                    .unlocked(unlocked)
                    .unlockedAt(unlocked ? ua.get().getUnlockedAt() : null)
                    .build());
        }
        return out;
    }

    @Transactional
    public List<AchievementDTO> listForUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        syncAchievements(user);
        List<AchievementDefinition> defs = definitionRepository.findAllByOrderBySortOrderAsc();
        List<AchievementDTO> out = new ArrayList<>(defs.size());
        for (AchievementDefinition def : defs) {
            var ua = userAchievementRepository.findByUser_IdAndAchievement_Id(user.getId(), def.getId());
            boolean unlocked = ua.isPresent();
            out.add(AchievementDTO.builder()
                    .code(def.getCode())
                    .title(def.getTitle())
                    .description(def.getDescription())
                    .iconKey(def.getIconKey())
                    .tier(def.getTier())
                    .sortOrder(def.getSortOrder() != null ? def.getSortOrder() : 0)
                    .unlocked(unlocked)
                    .unlockedAt(unlocked ? ua.get().getUnlockedAt() : null)
                    .build());
        }
        return out;
    }

    private void syncAchievements(User u) {
        tryGrant(u, "JOINED_ARENA", () -> true);
        tryGrant(u, "FIRST_CLEAR", () -> n(u.getTotalChallengesCompleted()) > 0);
        tryGrant(u, "THREE_CLEARS", () -> n(u.getTotalChallengesCompleted()) >= 3);
        tryGrant(u, "FIVE_CLEARS", () -> n(u.getTotalChallengesCompleted()) >= 5);
        tryGrant(u, "TEN_CLEARS", () -> n(u.getTotalChallengesCompleted()) >= 10);
        tryGrant(u, "INBOX_VERIFIED", () -> Boolean.TRUE.equals(u.getEmailVerified()));
        tryGrant(u, "BETA_PIONEER", () -> Boolean.TRUE.equals(u.getBetaLegacy()));
        tryGrant(u, "ALPHA_WAVE", () -> u.getCreatedAt() != null && u.getCreatedAt().isBefore(ALPHA_SEASON_END));
        tryGrant(u, "TEN_TESTS", () -> n(u.getTotalTestsPassed()) >= 10);
        tryGrant(u, "FIFTY_TESTS", () -> n(u.getTotalTestsPassed()) >= 50);
        tryGrant(u, "HUNDRED_TESTS", () -> n(u.getTotalTestsPassed()) >= 100);
        tryGrant(u, "LEVEL_FIVE", () -> n(u.getLevel()) >= 5);
        tryGrant(u, "LEVEL_TEN", () -> n(u.getLevel()) >= 10);
        tryGrant(u, "LEVEL_TWENTY", () -> n(u.getLevel()) >= 20);
        tryGrant(u, "XP_1K", () -> n(u.getExperiencePoints()) >= 1_000);
        tryGrant(u, "XP_5K", () -> n(u.getExperiencePoints()) >= 5_000);
        tryGrant(u, "ELO_1200", () -> n(u.getRating()) >= 1_200);
        tryGrant(u, "ELO_1500", () -> n(u.getRating()) >= 1_500);
        tryGrant(u, "GITHUB_LINKED", () -> hasText(u.getGithubUsername()));
        tryGrant(u, "OPERATOR_BIO", () -> hasText(u.getBio()));
        tryGrant(u, "AVATAR_SET", () -> hasText(u.getAvatarUrl()));
        tryGrant(u, "FOCUS_HOUR", () -> l(u.getTotalDevelopmentSeconds()) >= 3_600L);
        tryGrant(u, "CODE_MARATHON", () -> l(u.getTotalDevelopmentSeconds()) >= 36_000L);
        tryGrant(u, "ARENA_REGULAR", () -> l(u.getTotalBrowsingSeconds()) >= 3_600L);
        tryGrant(u, "DEEP_ARENA", () -> l(u.getTotalBrowsingSeconds()) >= 36_000L);
    }

    @Transactional
    public void tryGrantWeeklyStreakAchievements(Long userId, int currentStreakWeeks) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return;
        }
        tryGrant(user, "WEEKLY_STREAK_4", () -> currentStreakWeeks >= 4);
        tryGrant(user, "WEEKLY_STREAK_12", () -> currentStreakWeeks >= 12);
    }

    private static int n(Integer v) {
        return v != null ? v : 0;
    }

    private static long l(Long v) {
        return v != null ? v : 0L;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private void tryGrant(User user, String code, Supplier<Boolean> condition) {
        if (!Boolean.TRUE.equals(condition.get())) {
            return;
        }
        AchievementDefinition def = definitionRepository.findByCode(code).orElse(null);
        if (def == null) {
            return;
        }
        if (userAchievementRepository.existsByUser_IdAndAchievement_Id(user.getId(), def.getId())) {
            return;
        }
        UserAchievement ua = new UserAchievement();
        ua.setUser(user);
        ua.setAchievement(def);
        ua.setUnlockedAt(LocalDateTime.now(ZoneOffset.UTC));
        userAchievementRepository.save(ua);
        achievementNotificationDispatchService.notifyUnlocked(
                user.getId(),
                def.getCode(),
                def.getTitle(),
                def.getTier());
    }
}
