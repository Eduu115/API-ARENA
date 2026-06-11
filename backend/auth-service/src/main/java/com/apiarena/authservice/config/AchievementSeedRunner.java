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
        upsertIfMissing("WEEKLY_STREAK_4", "Monthly momentum", "Maintained a 4-week activity streak.", "flame", "RARE", 20);
        upsertIfMissing("WEEKLY_STREAK_12", "Season holder", "Maintained a 12-week activity streak.", "flame", "EPIC", 21);
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
