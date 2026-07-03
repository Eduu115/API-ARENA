package com.apiarena.authservice.model.dto;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import com.apiarena.authservice.model.entities.AdminCapability;
import com.apiarena.authservice.model.entities.User;

@Data
public class SetRoleRequest {
    @NotNull
    private User.Role role;

    /** Only used when role == ADMIN: the exact capability set the admin should have. Null = leave as-is. */
    private List<AdminCapability> capabilities;
}
