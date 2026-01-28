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
    
}
