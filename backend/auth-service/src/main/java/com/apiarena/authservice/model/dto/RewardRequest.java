package com.apiarena.authservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RewardRequest {
    private Integer xpEarned;
    private Integer eloChange;
    private Boolean isFirstCompletion;
}
