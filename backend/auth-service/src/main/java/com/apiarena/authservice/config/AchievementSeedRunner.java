package com.apiarena.authservice.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.apiarena.authservice.model.entities.AchievementDefinition;
import com.apiarena.authservice.repository.AchievementDefinitionRepository;

import lombok.RequiredArgsConstructor;

/**
 * Seeds achievement definitions when the table is empty (e.g. existing DB volumes without init-db replay).
 */
@Component
@Order(2)
@RequiredArgsConstructor
public class AchievementSeedRunner implements CommandLineRunner {

    private final AchievementDefinitionRepository achievementDefinitionRepository;

    @Override
    public void run(String... args) {
        if (achievementDefinitionRepository.count() == 0) {
            seedDefaults();
        }
        seedExtendedCatalog();
    }

    private void seedDefaults() {
        int order = 0;
        save("JOINED_ARENA", "Entered the Arena", "You created an API Arena account — welcome to the run.", "gate", "COMMON", order++);
        save("FIRST_CLEAR", "First clear", "Completed at least one challenge submission.", "target", "COMMON", order++);
        save("INBOX_VERIFIED", "Signal verified", "Confirmed your email address.", "mail", "RARE", order++);
        save("BETA_PIONEER", "Beta pilot", "Early-access cohort — you joined while the platform is still in beta.", "flame", "EPIC", order++);
        save("ALPHA_WAVE", "Alpha season", "Account opened during the alpha window (pre–July 2026).", "star", "LEGEND", order++);
        save("TEN_TESTS", "Test marathon", "Passed at least 10 automated HTTP tests across submissions.", "bolt", "RARE", order++);
        save("LEVEL_FIVE", "Level V", "Reached account level 5 or higher.", "crown", "EPIC", order++);
        seedExtendedCatalog();
    }

    private void seedExtendedCatalog() {
        upsertIfMissing("WEEKLY_STREAK_4", "Monthly momentum", "Maintained a 4-week activity streak.", "flame", "RARE", 20);
        upsertIfMissing("WEEKLY_STREAK_12", "Season holder", "Maintained a 12-week activity streak.", "flame", "EPIC", 21);
        upsertIfMissing("THREE_CLEARS", "Triple threat", "Completed 3 challenges.", "target", "COMMON", 22);
        upsertIfMissing("FIVE_CLEARS", "Five-peat", "Completed 5 challenges.", "target", "RARE", 23);
        upsertIfMissing("TEN_CLEARS", "Decalogue", "Completed 10 challenges.", "trophy", "EPIC", 24);
        upsertIfMissing("FIFTY_TESTS", "Test sprinter", "Passed 50 automated HTTP tests across submissions.", "bolt", "RARE", 25);
        upsertIfMissing("HUNDRED_TESTS", "Test centurion", "Passed 100 automated HTTP tests across submissions.", "bolt", "LEGEND", 26);
        upsertIfMissing("LEVEL_TEN", "Level X", "Reached account level 10 or higher.", "crown", "EPIC", 27);
        upsertIfMissing("LEVEL_TWENTY", "Level XX", "Reached account level 20 or higher.", "crown", "LEGEND", 28);
        upsertIfMissing("XP_1K", "XP milestone", "Earned at least 1,000 experience points.", "star", "COMMON", 29);
        upsertIfMissing("XP_5K", "XP veteran", "Earned at least 5,000 experience points.", "star", "EPIC", 30);
        upsertIfMissing("ELO_1200", "Rank climber", "Reached an ELO rating of 1,200 or higher.", "rank", "RARE", 31);
        upsertIfMissing("ELO_1500", "Rank elite", "Reached an ELO rating of 1,500 or higher.", "rank", "EPIC", 32);
        upsertIfMissing("GITHUB_LINKED", "Repo linked", "Added a GitHub username to your profile.", "link", "COMMON", 33);
        upsertIfMissing("OPERATOR_BIO", "Operator bio", "Wrote a bio on your public profile.", "code", "COMMON", 34);
        upsertIfMissing("FOCUS_HOUR", "Focus hour", "Logged at least 1 hour of active coding time on challenges.", "clock", "RARE", 35);
        upsertIfMissing("CODE_MARATHON", "Code marathon", "Logged at least 10 hours of active coding time on challenges.", "clock", "EPIC", 36);
        upsertIfMissing("ARENA_REGULAR", "Arena regular", "Spent at least 1 hour actively browsing the platform.", "gate", "COMMON", 37);
        upsertIfMissing("DEEP_ARENA", "Deep arena", "Spent at least 10 hours actively browsing the platform.", "gate", "RARE", 38);
        upsertIfMissing("AVATAR_SET", "Face card", "Set a custom avatar on your profile.", "diamond", "COMMON", 39);
    }

    private void upsertIfMissing(String code, String title, String description, String iconKey, String tier, int sortOrder) {
        if (achievementDefinitionRepository.findByCode(code).isPresent()) {
            return;
        }
        save(code, title, description, iconKey, tier, sortOrder);
    }

    private void save(String code, String title, String description, String iconKey, String tier, int sortOrder) {
        AchievementDefinition d = new AchievementDefinition();
        d.setCode(code);
        d.setTitle(title);
        d.setDescription(description);
        d.setIconKey(iconKey);
        d.setTier(tier);
        d.setSortOrder(sortOrder);
        achievementDefinitionRepository.save(d);
    }
}
