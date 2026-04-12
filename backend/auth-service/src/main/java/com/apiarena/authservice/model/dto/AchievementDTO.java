package com.apiarena.authservice.model.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementDTO {
    private String code;
    private String title;
    private String description;
    private String iconKey;
    private String tier;
    private int sortOrder;
    private boolean unlocked;
    private LocalDateTime unlockedAt;
}
