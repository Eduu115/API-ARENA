package com.apiarena.authservice.restcontroller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.Map;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import com.apiarena.authservice.model.dto.AchievementDTO;
import com.apiarena.authservice.model.dto.AuthResponse;
import com.apiarena.authservice.model.dto.ForgotPasswordRequest;
import com.apiarena.authservice.model.dto.LoginRequest;
import com.apiarena.authservice.model.dto.ResetPasswordRequest;
import com.apiarena.authservice.model.dto.PublicProfileDTO;
import com.apiarena.authservice.model.dto.RefreshTokenRequest;
import com.apiarena.authservice.model.dto.RegisterRequest;
import com.apiarena.authservice.model.dto.ResendVerificationRequest;
import com.apiarena.authservice.model.dto.UpdateProfileRequest;
import com.apiarena.authservice.model.dto.UsageDeltaRequest;
import com.apiarena.authservice.model.dto.UserDTO;
import com.apiarena.authservice.model.dto.VerifyEmailResponseDTO;
import com.apiarena.authservice.model.dto.WeeklyStreakDTO;
import com.apiarena.authservice.model.services.AchievementService;
import com.apiarena.authservice.model.services.IAuthService;
import com.apiarena.authservice.model.services.IUserService;
import com.apiarena.authservice.model.services.WeeklyStreakService;

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
    @Autowired
    private AchievementService achievementService;
    @Autowired
    private WeeklyStreakService weeklyStreakService;

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

    @GetMapping("/verify-email")
    @Operation(summary = "Verify email", description = "Confirm email address using the token from the verification link")
    public ResponseEntity<VerifyEmailResponseDTO> verifyEmail(@RequestParam("token") String token) {
        VerifyEmailResponseDTO body = authService.verifyEmail(token);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend verification email", description = "Send a new verification link (always returns the same message for privacy)")
    public ResponseEntity<Map<String, String>> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerificationEmail(request.getEmail());
        return ResponseEntity.ok(Map.of(
                "message", "If an account exists with this email, a verification link has been sent."));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset", description = "Sends a reset link if the email exists (always returns the same message for privacy)")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request.getEmail());
        return ResponseEntity.ok(Map.of(
                "message", "If an account exists with this email, a password reset link has been sent."));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Sets a new password using the token from the reset link")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password updated. You can now log in."));
    }

    @GetMapping("/users/{id}/profile")
    @Operation(summary = "Get public profile", description = "Get a user's public profile by ID (no auth required)")
    public ResponseEntity<PublicProfileDTO> getPublicProfile(@PathVariable Long id) {
        PublicProfileDTO profile = userService.getPublicProfile(id);
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/users/{id}/achievements")
    @Operation(summary = "Get public achievements", description = "List achievement unlock status for a user (no auth required)")
    public ResponseEntity<List<AchievementDTO>> getPublicAchievements(@PathVariable Long id) {
        return ResponseEntity.ok(achievementService.listForUserId(id));
    }

    @GetMapping("/me/achievements")
    @Operation(summary = "List achievements for current user", description = "All definitions with unlock status; syncs grants from profile stats.")
    public ResponseEntity<List<AchievementDTO>> getMyAchievements() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return ResponseEntity.ok(achievementService.listForCurrentUserEmail(email));
    }

    @GetMapping("/me/streak")
    @Operation(summary = "Weekly streak progress", description = "ISO week streak state and progress toward weekly goals.")
    public ResponseEntity<WeeklyStreakDTO> getMyWeeklyStreak() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        UserDTO user = userService.getUserByEmail(email);
        return ResponseEntity.ok(weeklyStreakService.getStreakForUser(user.getId()));
    }

    @PostMapping("/me/usage")
    @Operation(summary = "Report browsing time", description = "Adds active browsing seconds for the current user (visible tab, not idle).")
    public ResponseEntity<Void> postBrowsingUsage(@Valid @RequestBody UsageDeltaRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        UserDTO user = userService.getUserByEmail(email);
        userService.addBrowsingTimeSeconds(user.getId(), request.getBrowsingSecondsDelta());
        return ResponseEntity.accepted().build();
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

    @GetMapping("/me/export")
    @Operation(summary = "Export my data", description = "GDPR portability: download a JSON snapshot of the current user's personal data")
    public ResponseEntity<Map<String, Object>> exportMyData() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        Map<String, Object> data = userService.exportUserData(email);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"api-arena-my-data.json\"")
                .body(data);
    }

    @DeleteMapping("/me")
    @Operation(summary = "Delete my account", description = "GDPR right to erasure: permanently deletes the current user's account and associated personal data")
    public ResponseEntity<Void> deleteMyAccount() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        userService.deleteAccount(email);
        return ResponseEntity.noContent().build();
    }
}