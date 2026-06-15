package com.apiarena.authservice.restcontroller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.authservice.model.dto.ProfileBadgeDTO;
import com.apiarena.authservice.model.dto.ProfileBadgeDisplayDTO;
import com.apiarena.authservice.model.dto.UpdateDisplayedBadgesRequest;
import com.apiarena.authservice.model.dto.UserDTO;
import com.apiarena.authservice.model.services.IUserService;
import com.apiarena.authservice.model.services.ProfileBadgeService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Profile badges", description = "Collectible profile badges")
@RequiredArgsConstructor
public class ProfileBadgeController {

    private final ProfileBadgeService profileBadgeService;
    private final IUserService userService;

    @GetMapping("/me/badges")
    @Operation(summary = "List profile badges for current user", description = "All badge definitions with unlock and display status.")
    public ResponseEntity<List<ProfileBadgeDTO>> getMyBadges() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(profileBadgeService.listForCurrentUserEmail(email));
    }

    @PutMapping("/me/badges/display")
    @Operation(summary = "Choose displayed profile badges", description = "Up to 5 unlocked collectible badges. Rank badges are always shown separately when qualified.")
    public ResponseEntity<List<ProfileBadgeDTO>> updateDisplayedBadges(
            @Valid @RequestBody UpdateDisplayedBadgesRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDTO user = userService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(profileBadgeService.updateDisplayedBadges(user.getId(), request.getCodes()));
    }

    @GetMapping("/users/{id}/badges")
    @Operation(summary = "Public displayed badges", description = "Badges the user chose to show on their profile.")
    public ResponseEntity<List<ProfileBadgeDisplayDTO>> getPublicDisplayedBadges(@PathVariable Long id) {
        return ResponseEntity.ok(profileBadgeService.getDisplayedForPublicUser(id));
    }
}
