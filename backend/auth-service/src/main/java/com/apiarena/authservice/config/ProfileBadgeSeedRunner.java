package com.apiarena.authservice.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.apiarena.authservice.model.entities.ProfileBadgeDefinition;
import com.apiarena.authservice.repository.ProfileBadgeDefinitionRepository;
import com.apiarena.authservice.model.services.ProfileBadgeService;

import lombok.RequiredArgsConstructor;

@Component
@Order(3)
@RequiredArgsConstructor
public class ProfileBadgeSeedRunner implements CommandLineRunner {

    private final ProfileBadgeDefinitionRepository repository;
    private final ProfileBadgeService profileBadgeService;

    @Override
    public void run(String... args) {
        seedCatalog();
        profileBadgeService.purgeDeprecatedDefinitions();
    }

    private void seedCatalog() {
        int order = 0;
        upsert("ALPHA", "Alpha", "Alpha season", "Account opened during the alpha window (pre–July 2026).", "alpha", "LEGEND", order++);
        upsert("BETA", "Beta", "Beta pioneer", "Early-access cohort — joined while the platform is in beta.", "beta", "LEGEND", order++);
        upsert("FIRST_CLEAR", "First clear", "First clear", "Completed at least one challenge submission.", "clear", "COMMON", order++);
        upsert("INBOX_VERIFIED", "Verified", "Signal verified", "Confirmed your email address.", "verified", "RARE", order++);
        upsert("THREE_CLEARS", "×3 clears", "Triple threat", "Completed 3 challenges.", "clear", "COMMON", order++);
        upsert("FIVE_CLEARS", "×5 clears", "Five-peat", "Completed 5 challenges.", "clear", "RARE", order++);
        upsert("TEN_CLEARS", "×10 clears", "Decalogue", "Completed 10 challenges.", "trophy", "EPIC", order++);
        upsert("LEVEL_FIVE", "Level V", "Level V", "Reached account level 5 or higher.", "level", "EPIC", order++);
        upsert("LEVEL_TEN", "Level X", "Level X", "Reached account level 10 or higher.", "level", "EPIC", order++);
        upsert("LEVEL_TWENTY", "Level XX", "Level XX", "Reached account level 20 or higher.", "level", "LEGEND", order++);
        upsert("ELO_1200", "ELO 1200+", "Rank climber", "Reached an ELO rating of 1,200+ (ranked).", "elo", "RARE", order++);
        upsert("ELO_1500", "ELO 1500+", "Rank elite", "Reached an ELO rating of 1,500+ (ranked).", "elo", "LEGEND", order++);
        upsert("WEEKLY_STREAK_4", "Streak ×4", "Monthly momentum", "Maintained a 4-week activity streak.", "streak", "EPIC", order++);
        upsert("WEEKLY_STREAK_12", "Streak ×12", "Season holder", "Maintained a 12-week activity streak.", "streak", "LEGEND", order++);
        upsert("GITHUB_LINKED", "GitHub", "Repo linked", "Added a GitHub username to your profile.", "link", "COMMON", order++);
    }

    private void upsert(String code, String displayLabel, String title, String description,
            String styleKey, String tier, int sortOrder) {
        ProfileBadgeDefinition def = repository.findByCode(code).orElseGet(ProfileBadgeDefinition::new);
        def.setCode(code);
        def.setDisplayLabel(displayLabel);
        def.setTitle(title);
        def.setDescription(description);
        def.setStyleKey(styleKey);
        def.setTier(tier);
        def.setSortOrder(sortOrder);
        repository.save(def);
    }
}
