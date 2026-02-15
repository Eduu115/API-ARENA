package com.apiarena.authservice.model.dto;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @Builder

public class AuthResponse {
    private UserDTO user;
    private String accessToken;
    private String refreshToken;

    public AuthResponse(UserDTO user, String accessToken, String refreshToken) {
        this.user = user;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
    
}
