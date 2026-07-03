package com.apiarena.authservice.model.dto;

import java.util.List;

public record ModerationStatsDTO(long totalBans, long totalUnbans, List<CategoryCount> byCategory) {

    public record CategoryCount(String category, long count) {
    }
}
