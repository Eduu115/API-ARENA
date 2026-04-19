package com.apiarena.authservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor @AllArgsConstructor

public class UpdateProfileRequest {
    
    private String avatarUrl;
    private String bio;
    private String githubUsername;
    /** When set, updates student opt-in for new-challenge alert emails. */
    private Boolean newChallengeEmailAlerts;
    
}
