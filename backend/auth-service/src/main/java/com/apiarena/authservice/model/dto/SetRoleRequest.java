package com.apiarena.authservice.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import com.apiarena.authservice.model.entities.User;

@Data
public class SetRoleRequest {
    @NotNull
    private User.Role role;
}
