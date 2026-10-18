package com.apiarena.authservice.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Body for {@code POST /api/auth/admin/users/{id}/password}.
 * Same constraints as registration ({@code @NotBlank} + {@code @Size(min = 6)}).
 * {@code toString} never includes the password.
 */
@Getter
@Setter
public class AdminSetPasswordRequest {

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String newPassword;

    @Override
    public String toString() {
        return "AdminSetPasswordRequest{newPassword=[redacted]}";
    }
}
