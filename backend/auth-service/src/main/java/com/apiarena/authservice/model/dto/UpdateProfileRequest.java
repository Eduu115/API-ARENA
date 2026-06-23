package com.apiarena.authservice.model.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

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
    @JsonAlias("challengesNewsletter")
    private Boolean newChallengeEmailAlerts;
    /** UI locale preference: `en` or `es`. */
    private String preferredLocale;
    
}
