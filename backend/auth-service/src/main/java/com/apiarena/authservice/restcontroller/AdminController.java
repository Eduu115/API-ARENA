package com.apiarena.authservice.restcontroller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.authservice.model.dto.AdjustUserRequest;
import com.apiarena.authservice.model.dto.AdminAuditRowDTO;
import com.apiarena.authservice.model.dto.AdminMessageRequest;
import com.apiarena.authservice.model.dto.AdminStatsDTO;
import com.apiarena.authservice.model.dto.AdminUserDTO;
import com.apiarena.authservice.model.dto.AuthResponse;
import com.apiarena.authservice.model.dto.BanRequest;
import com.apiarena.authservice.model.dto.SetRoleRequest;
import com.apiarena.authservice.model.dto.UnbanRequest;
import com.apiarena.authservice.model.dto.WarnRequest;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.model.services.AdminService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Admin console API. Every endpoint is ADMIN-only (RBAC via method security). */
@RestController
@RequestMapping("/api/auth/admin")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class AdminController {

    /** Operational (moderation) actions: any ADMIN holding the MODERATION capability. Reads stay ADMIN-wide. */
    private static final String MODERATION = "hasRole('ADMIN') and hasAuthority('CAP_MODERATION')";

    private final AdminService adminService;

    @GetMapping("/stats")
    @Operation(summary = "Console stats", description = "Counts by role, banned and online now")
    public ResponseEntity<AdminStatsDTO> stats() {
        return ResponseEntity.ok(adminService.stats());
    }

    @GetMapping("/users")
    @Operation(summary = "Search users", description = "Paginated search by username/email with role/status filters")
    public ResponseEntity<Page<AdminUserDTO>> searchUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) User.Role role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(adminService.searchUsers(query, role, active, page, size));
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "User detail")
    public ResponseEntity<AdminUserDTO> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUser(id));
    }

    @PreAuthorize(MODERATION)
    @PostMapping("/users/{id}/ban")
    @Operation(summary = "Ban user", description = "Category/reason/description + optional expiry; revokes sessions, emails, records history")
    public ResponseEntity<AdminUserDTO> ban(
            @PathVariable Long id, @Valid @RequestBody BanRequest request, Authentication auth) {
        return ResponseEntity.ok(adminService.ban(id, request.getCategory(), request.getReason(),
                request.getDescription(), request.getUntil(), auth.getName()));
    }

    @PreAuthorize(MODERATION)
    @PostMapping("/users/{id}/unban")
    @Operation(summary = "Unban user", description = "Reactivates the account (reason/description recorded) and clears ban + warnings")
    public ResponseEntity<AdminUserDTO> unban(
            @PathVariable Long id, @Valid @RequestBody UnbanRequest request, Authentication auth) {
        return ResponseEntity.ok(adminService.unban(id, request.getReason(), request.getDescription(), auth.getName()));
    }

    @PreAuthorize(MODERATION)
    @PostMapping("/users/{id}/deactivate")
    @Operation(summary = "Deactivate account", description = "Baja: deactivate without banning or deleting data; revokes sessions. Reversible.")
    public ResponseEntity<AdminUserDTO> deactivate(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(adminService.deactivate(id, auth.getName()));
    }

    @PreAuthorize(MODERATION)
    @PostMapping("/users/{id}/reactivate")
    @Operation(summary = "Reactivate account", description = "Reactivate a deactivated (baja) account. Bans use unban.")
    public ResponseEntity<AdminUserDTO> reactivate(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(adminService.reactivate(id, auth.getName()));
    }

    @GetMapping("/users/{id}/moderation")
    @Operation(summary = "Moderation history", description = "Ban/unban records with the form answers")
    public ResponseEntity<java.util.List<com.apiarena.authservice.model.dto.ModerationRecordDTO>> moderation(
            @PathVariable Long id) {
        return ResponseEntity.ok(adminService.moderationHistory(id));
    }

    @PreAuthorize(MODERATION)
    @PostMapping("/users/{id}/warn")
    @Operation(summary = "Warn user", description = "Adds a warning (auto-ban at 3), emails the user")
    public ResponseEntity<AdminUserDTO> warn(
            @PathVariable Long id, @Valid @RequestBody WarnRequest request, Authentication auth) {
        return ResponseEntity.ok(adminService.warn(id, request.getReason(), auth.getName()));
    }

    @PreAuthorize(MODERATION)
    @PostMapping("/users/{id}/clear-warnings")
    @Operation(summary = "Clear warnings")
    public ResponseEntity<AdminUserDTO> clearWarnings(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(adminService.clearWarnings(id, auth.getName()));
    }

    @PostMapping("/users/{id}/role")
    @Operation(summary = "Set role", description = "Promote/demote STUDENT / TEACHER / ADMIN; ADMIN carries capabilities (supreme only)")
    public ResponseEntity<AdminUserDTO> setRole(
            @PathVariable Long id, @Valid @RequestBody SetRoleRequest request, Authentication auth) {
        return ResponseEntity.ok(
                adminService.setRole(id, request.getRole(), request.getCapabilities(), auth.getName()));
    }

    @PreAuthorize(MODERATION)
    @PostMapping("/users/{id}/verify-email")
    @Operation(summary = "Force-verify email")
    public ResponseEntity<AdminUserDTO> verifyEmail(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(adminService.verifyEmail(id, auth.getName()));
    }

    @PreAuthorize(MODERATION)
    @PostMapping("/users/{id}/logout")
    @Operation(summary = "Force logout", description = "Revoke all of the user's sessions")
    public ResponseEntity<Void> forceLogout(@PathVariable Long id, Authentication auth) {
        adminService.forceLogout(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize(MODERATION)
    @PostMapping("/users/{id}/reset-2fa")
    @Operation(summary = "Reset 2FA", description = "Clear TOTP so the user re-enrols next login")
    public ResponseEntity<AdminUserDTO> resetTwoFactor(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(adminService.resetTwoFactor(id, auth.getName()));
    }

    @PreAuthorize(MODERATION)
    @PostMapping("/users/{id}/message")
    @Operation(summary = "Message user", description = "Send an email + in-app notification")
    public ResponseEntity<Void> message(
            @PathVariable Long id, @Valid @RequestBody AdminMessageRequest request, Authentication auth) {
        adminService.sendMessage(id, request.getTitle(), request.getBody(), auth.getName());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize(MODERATION)
    @PostMapping("/users/{id}/adjust")
    @Operation(summary = "Adjust ELO/XP", description = "Signed deltas; level recomputed from XP")
    public ResponseEntity<AdminUserDTO> adjust(
            @PathVariable Long id, @RequestBody AdjustUserRequest request, Authentication auth) {
        return ResponseEntity.ok(adminService.adjust(id, request.getRatingDelta(), request.getXpDelta(), auth.getName()));
    }

    @PreAuthorize(MODERATION)
    @PostMapping("/users/{id}/impersonate")
    @Operation(summary = "Impersonate", description = "Mint tokens to act as this user (audited)")
    public ResponseEntity<AuthResponse> impersonate(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(adminService.impersonate(id, auth.getName()));
    }

    @PreAuthorize(MODERATION)
    @DeleteMapping("/users/{id}")
    @Operation(summary = "Delete account", description = "GDPR-grade erasure of the account and its data")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Authentication auth) {
        adminService.deleteUser(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/moderation/stats")
    @Operation(summary = "Moderation analytics", description = "Total bans/unbans and ban breakdown by category")
    public ResponseEntity<com.apiarena.authservice.model.dto.ModerationStatsDTO> moderationStats() {
        return ResponseEntity.ok(adminService.moderationStats());
    }

    @GetMapping("/me/capabilities")
    @Operation(summary = "My capabilities", description = "Capabilities of the acting admin, to gate the console UI")
    public ResponseEntity<java.util.List<com.apiarena.authservice.model.entities.AdminCapability>> myCapabilities(
            Authentication auth) {
        return ResponseEntity.ok(adminService.myCapabilities(auth.getName()));
    }

    @GetMapping("/users/{id}/capabilities")
    @Operation(summary = "Admin capabilities", description = "Capabilities granted to an admin account")
    public ResponseEntity<java.util.List<com.apiarena.authservice.model.entities.AdminCapability>> capabilities(
            @PathVariable Long id) {
        return ResponseEntity.ok(adminService.capabilitiesOf(id));
    }

    @PostMapping("/users/{id}/capabilities/{capability}")
    @Operation(summary = "Grant capability", description = "Give an ADMIN account a capability (MODERATION / BI)")
    public ResponseEntity<java.util.List<com.apiarena.authservice.model.entities.AdminCapability>> grantCapability(
            @PathVariable Long id,
            @PathVariable com.apiarena.authservice.model.entities.AdminCapability capability,
            Authentication auth) {
        return ResponseEntity.ok(adminService.grantCapability(id, capability, auth.getName()));
    }

    @DeleteMapping("/users/{id}/capabilities/{capability}")
    @Operation(summary = "Revoke capability", description = "Remove a capability from an admin account")
    public ResponseEntity<java.util.List<com.apiarena.authservice.model.entities.AdminCapability>> revokeCapability(
            @PathVariable Long id,
            @PathVariable com.apiarena.authservice.model.entities.AdminCapability capability,
            Authentication auth) {
        return ResponseEntity.ok(adminService.revokeCapability(id, capability, auth.getName()));
    }

    @GetMapping("/audit")
    @Operation(summary = "Audit log", description = "Recent admin actions (most recent first)")
    public ResponseEntity<Page<AdminAuditRowDTO>> audit(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(adminService.auditLog(page, size));
    }
}
