package com.apiarena.authservice.restcontroller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.authservice.model.dto.AuthResponse;
import com.apiarena.authservice.model.dto.LoginRequest;
import com.apiarena.authservice.model.dto.RefreshTokenRequest;
import com.apiarena.authservice.model.dto.RegisterRequest;
import com.apiarena.authservice.model.dto.UpdateProfileRequest;
import com.apiarena.authservice.model.dto.UserDTO;
import com.apiarena.authservice.model.services.IAuthService;
import com.apiarena.authservice.model.services.IUserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")

@Tag(name = "Authentication", description = "Authentication and user management endpoints")
public class AuthController {

    @Autowired
    private IAuthService authService;
    @Autowired
    private IUserService userService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Create a new user account. No tokens are returned; use /login to get access and refresh tokens.")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate user and get access token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Get a new access token using refresh token")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Revoke refresh token")
    public ResponseEntity<Void> logout(@RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Get authenticated user information")
    public ResponseEntity<UserDTO> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        UserDTO user = userService.getUserByEmail(email);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/me")
    @Operation(summary = "Update profile", description = "Update current user profile")
    public ResponseEntity<UserDTO> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        UserDTO currentUser = userService.getUserByEmail(email);
        UserDTO updatedUser = userService.updateProfile(currentUser.getId(), request);
        return ResponseEntity.ok(updatedUser);
    }
}