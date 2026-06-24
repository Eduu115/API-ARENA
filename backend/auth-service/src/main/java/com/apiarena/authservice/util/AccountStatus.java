package com.apiarena.authservice.util;

import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.apiarena.authservice.model.entities.User;

public final class AccountStatus {

    private AccountStatus() {
    }

    public static boolean isLoginAllowed(User user) {
        return user != null && Boolean.TRUE.equals(user.getIsActive());
    }

    /**
     * Treat deactivated accounts like unknown users at login (generic bad-credentials path).
     */
    public static void requireLoginAllowed(User user, String email) throws UsernameNotFoundException {
        if (!isLoginAllowed(user)) {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }
    }
}
