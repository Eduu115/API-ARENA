package com.apiarena.authservice.model.services;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Supplier;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.authservice.model.dto.ProfileBadgeDTO;
import com.apiarena.authservice.model.dto.ProfileBadgeDisplayDTO;
import com.apiarena.authservice.model.entities.ProfileBadgeDefinition;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.model.entities.UserProfileBadge;
import com.apiarena.authservice.model.entities.UserStreakState;
import com.apiarena.authservice.repository.ProfileBadgeDefinitionRepository;
import com.apiarena.authservice.repository.UserProfileBadgeRepository;
import com.apiarena.authservice.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProfileBadgeService {

    public static final int MAX_DISPLAYED_BADGES = 5;
    private static final LocalDateTime ALPHA_SEASON_END = LocalDateTime.of(2026, 7, 1, 0, 0, 0);
    private static final int MIN_RANKED_CHALLENGES = 3;
    private static final Set<String> DEPRECATED_BADGE_CODES = Set.of("OPERATOR_BIO", "AVATAR_SET");

    private final UserRepository userRepository;
    private final ProfileBadgeDefinitionRepository definitionRepository;
    private final UserProfileBadgeRepository userBadgeRepository;
    private final WeeklyStreakService weeklyStreakService;
    private final ObjectMapper objectMapper;

    @Transactional
    public List<ProfileBadgeDTO> listForCurrentUserEmail(String email) {
        User user = userRepository.findByEmailIgnoreCase(email.trim()).orElseThrow();
        return listForUser(user);
    }

    @Transactional
    public List<ProfileBadgeDTO> listForUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        return listForUser(user);
    }

    @Transactional
    public List<ProfileBadgeDisplayDTO> getDisplayedForPublicUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        syncBadges(user);
        Set<String> displayedCodes = new HashSet<>(readDisplayedCodes(user));
        List<ProfileBadgeDefinition> defs = definitionRepository.findAllByOrderBySortOrderAsc();
        List<ProfileBadgeDisplayDTO> out = new ArrayList<>();
        for (ProfileBadgeDefinition def : defs) {
            if (DEPRECATED_BADGE_CODES.contains(def.getCode())) {
                continue;
            }
            if (!displayedCodes.contains(def.getCode())) {
                continue;
            }
            if (!userBadgeRepository.existsByUser_IdAndBadge_Id(user.getId(), def.getId())) {
                continue;
            }
            out.add(ProfileBadgeDisplayDTO.builder()
                    .code(def.getCode())
                    .displayLabel(def.getDisplayLabel())
                    .styleKey(def.getStyleKey())
                    .build());
        }
        return out;
    }

    @Transactional
    public List<ProfileBadgeDTO> updateDisplayedBadges(Long userId, List<String> requestedCodes) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        syncBadges(user);

        List<String> sanitized = new ArrayList<>();
        if (requestedCodes != null) {
            for (String raw : requestedCodes) {
                if (raw == null || raw.isBlank()) {
                    continue;
                }
                String code = raw.trim().toUpperCase();
                ProfileBadgeDefinition def = definitionRepository.findByCode(code).orElse(null);
                if (def == null) {
                    throw new IllegalArgumentException("Unknown badge code: " + code);
                }
                if (!userBadgeRepository.existsByUser_IdAndBadge_Id(userId, def.getId())) {
                    throw new IllegalArgumentException("Badge not unlocked: " + code);
                }
                if (!sanitized.contains(code)) {
                    sanitized.add(code);
                }
            }
        }
        if (sanitized.size() > MAX_DISPLAYED_BADGES) {
            throw new IllegalArgumentException("You can display at most " + MAX_DISPLAYED_BADGES + " badges.");
        }

        user.setDisplayedProfileBadges(writeDisplayedCodes(sanitized));
        userRepository.save(user);
        return listForUser(user);
    }

    @Transactional
    public void purgeDeprecatedDefinitions() {
        for (String code : DEPRECATED_BADGE_CODES) {
            definitionRepository.findByCode(code).ifPresent(def -> {
                userBadgeRepository.deleteByBadge_Id(def.getId());
                definitionRepository.delete(def);
            });
        }
    }

    private List<ProfileBadgeDTO> listForUser(User user) {
        syncBadges(user);
        Set<String> displayedCodes = new HashSet<>(readDisplayedCodes(user));
        List<ProfileBadgeDefinition> defs = definitionRepository.findAllByOrderBySortOrderAsc();
        List<ProfileBadgeDTO> out = new ArrayList<>(defs.size());
        for (ProfileBadgeDefinition def : defs) {
            if (DEPRECATED_BADGE_CODES.contains(def.getCode())) {
                continue;
            }
            var ub = userBadgeRepository.findByUser_IdAndBadge_Id(user.getId(), def.getId());
            boolean unlocked = ub.isPresent();
            out.add(ProfileBadgeDTO.builder()
                    .code(def.getCode())
                    .displayLabel(def.getDisplayLabel())
                    .title(def.getTitle())
                    .description(def.getDescription())
                    .styleKey(def.getStyleKey())
                    .tier(def.getTier())
                    .sortOrder(def.getSortOrder() != null ? def.getSortOrder() : 0)
                    .unlocked(unlocked)
                    .unlockedAt(unlocked ? ub.get().getUnlockedAt() : null)
                    .displayed(unlocked && displayedCodes.contains(def.getCode()))
                    .build());
        }
        return out;
    }

    private void syncBadges(User user) {
        UserStreakState streak = weeklyStreakService.findState(user.getId()).orElse(null);
        int streakWeeks = streak != null ? n(streak.getCurrentStreakWeeks()) : 0;

        tryGrant(user, "ALPHA", () -> user.getCreatedAt() != null && user.getCreatedAt().isBefore(ALPHA_SEASON_END));
        tryGrant(user, "BETA", () -> Boolean.TRUE.equals(user.getBetaLegacy()));
        tryGrant(user, "FIRST_CLEAR", () -> n(user.getTotalChallengesCompleted()) > 0);
        tryGrant(user, "INBOX_VERIFIED", () -> Boolean.TRUE.equals(user.getEmailVerified()));
        tryGrant(user, "THREE_CLEARS", () -> n(user.getTotalChallengesCompleted()) >= 3);
        tryGrant(user, "FIVE_CLEARS", () -> n(user.getTotalChallengesCompleted()) >= 5);
        tryGrant(user, "TEN_CLEARS", () -> n(user.getTotalChallengesCompleted()) >= 10);
        tryGrant(user, "LEVEL_FIVE", () -> n(user.getLevel()) >= 5);
        tryGrant(user, "LEVEL_TEN", () -> n(user.getLevel()) >= 10);
        tryGrant(user, "LEVEL_TWENTY", () -> n(user.getLevel()) >= 20);
        tryGrant(user, "ELO_1200", () -> isRanked(user) && n(user.getRating()) >= 1_200);
        tryGrant(user, "ELO_1500", () -> isRanked(user) && n(user.getRating()) >= 1_500);
        tryGrant(user, "WEEKLY_STREAK_4", () -> streakWeeks >= 4);
        tryGrant(user, "WEEKLY_STREAK_12", () -> streakWeeks >= 12);
        tryGrant(user, "GITHUB_LINKED", () -> hasText(user.getGithubUsername()));
    }

    private boolean isRanked(User user) {
        return n(user.getTotalChallengesCompleted()) >= MIN_RANKED_CHALLENGES;
    }

    private void tryGrant(User user, String code, Supplier<Boolean> condition) {
        if (!Boolean.TRUE.equals(condition.get())) {
            return;
        }
        ProfileBadgeDefinition def = definitionRepository.findByCode(code).orElse(null);
        if (def == null) {
            return;
        }
        if (userBadgeRepository.existsByUser_IdAndBadge_Id(user.getId(), def.getId())) {
            return;
        }
        UserProfileBadge ub = new UserProfileBadge();
        ub.setUser(user);
        ub.setBadge(def);
        ub.setUnlockedAt(LocalDateTime.now(ZoneOffset.UTC));
        userBadgeRepository.save(ub);
    }

    private List<String> readDisplayedCodes(User user) {
        String raw = user.getDisplayedProfileBadges();
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        try {
            List<String> parsed = objectMapper.readValue(raw, new TypeReference<List<String>>() {});
            if (parsed == null) {
                return List.of();
            }
            return parsed.stream()
                    .filter(code -> code != null && !DEPRECATED_BADGE_CODES.contains(code))
                    .toList();
        } catch (Exception e) {
            return List.of();
        }
    }

    private String writeDisplayedCodes(List<String> codes) {
        try {
            return objectMapper.writeValueAsString(codes != null ? codes : List.of());
        } catch (Exception e) {
            return "[]";
        }
    }

    private static int n(Integer v) {
        return v != null ? v : 0;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
