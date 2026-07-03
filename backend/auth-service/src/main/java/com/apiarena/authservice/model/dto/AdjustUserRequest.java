package com.apiarena.authservice.model.dto;

import lombok.Data;

/** Manual ELO/XP adjustment (signed deltas). Null = leave unchanged. */
@Data
public class AdjustUserRequest {
    private Integer ratingDelta;
    private Integer xpDelta;
}
