package com.apiarena.authservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder

public class AuthResponse {
    private UserDTO user;
    private String acessToken;
    private String refreshToken;
}
