package com.apiarena.authservice.model.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileBadgeDTO {

    private String code;
    private String displayLabel;
    private String title;
    private String description;
    private String styleKey;
    private String tier;
    private int sortOrder;
    private boolean unlocked;
    private LocalDateTime unlockedAt;
    private boolean displayed;
}
