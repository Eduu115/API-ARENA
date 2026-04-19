package com.apiarena.challengeservice.restcontroller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

import com.apiarena.challengeservice.model.dto.ChallengeDTO;
import com.apiarena.challengeservice.model.dto.ChallengePreviewDTO;
import com.apiarena.challengeservice.model.dto.ChallengeSummaryDTO;
import com.apiarena.challengeservice.model.dto.CreateChallengeRequest;
import com.apiarena.challengeservice.model.dto.UpdateChallengeRequest;
import com.apiarena.challengeservice.model.services.IChallengeService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/challenges")
@Tag(name = "Challenges", description = "Challenge management endpoints")
public class ChallengeController {

    @Autowired
    private IChallengeService challengeService;

    @GetMapping
    @Operation(summary = "Get all challenges", description = "Get all active challenges")
    public ResponseEntity<List<ChallengeSummaryDTO>> getAllChallenges(
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search
    ) {
        List<ChallengeSummaryDTO> challenges = challengeService.getChallengesByFilters(
                difficulty, category, search
        );
        return ResponseEntity.ok(challenges);
    }

    @GetMapping("/{id}/preview")
    @Operation(summary = "Get challenge preview by ID",
            description = "Public summary without technical specs (endpoints, test suite, hints).")
    public ResponseEntity<ChallengePreviewDTO> getChallengePreviewById(@PathVariable Long id) {
        return ResponseEntity.ok(challengeService.getChallengePreviewById(id));
    }

    @GetMapping("/{id}/specs")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get full challenge specs by ID",
            description = "Full challenge including endpoints and test suite — authenticated users only (e.g. submit flow).")
    public ResponseEntity<ChallengeDTO> getChallengeSpecsById(@PathVariable Long id) {
        ChallengeDTO challenge = challengeService.getChallengeById(id);
        return ResponseEntity.ok(challenge);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get challenge by ID", description = "Get full challenge details by ID (internal / legacy clients)")
    public ResponseEntity<ChallengeDTO> getChallengeById(@PathVariable Long id) {
        ChallengeDTO challenge = challengeService.getChallengeById(id);
        return ResponseEntity.ok(challenge);
    }

    @GetMapping("/slug/{slug}/preview")
    @Operation(summary = "Get challenge preview by slug", description = "Public summary without technical specs")
    public ResponseEntity<ChallengePreviewDTO> getChallengePreviewBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(challengeService.getChallengePreviewBySlug(slug));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get challenge by slug", description = "Get full challenge details by slug (internal / legacy clients)")
    public ResponseEntity<ChallengeDTO> getChallengeBySlug(@PathVariable String slug) {
        ChallengeDTO challenge = challengeService.getChallengeBySlug(slug);
        return ResponseEntity.ok(challenge);
    }

    @GetMapping("/featured")
    @Operation(summary = "Get featured challenges", description = "Get all featured challenges")
    public ResponseEntity<List<ChallengeSummaryDTO>> getFeaturedChallenges() {
        List<ChallengeSummaryDTO> challenges = challengeService.getFeaturedChallenges();
        return ResponseEntity.ok(challenges);
    }

    @GetMapping("/categories")
    @Operation(summary = "Get all categories", description = "Get list of all challenge categories")
    public ResponseEntity<List<String>> getAllCategories() {
        List<String> categories = challengeService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/mine")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get my challenges", description = "Get challenges created by current user (TEACHER/ADMIN only)")
    public ResponseEntity<List<ChallengeDTO>> getMyChallenges(
            @RequestParam(defaultValue = "true") boolean includeInactive
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = extractUserIdFromAuthentication(authentication);
        List<ChallengeDTO> challenges = challengeService.getMyChallenges(userId, includeInactive);
        return ResponseEntity.ok(challenges);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create challenge", description = "Create a new challenge (TEACHER/ADMIN only)")
    public ResponseEntity<ChallengeDTO> createChallenge(@Valid @RequestBody CreateChallengeRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = extractUserIdFromAuthentication(authentication);
        
        ChallengeDTO challenge = challengeService.createChallenge(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(challenge);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update challenge", description = "Update an existing challenge (TEACHER/ADMIN only)")
    public ResponseEntity<ChallengeDTO> updateChallenge(
            @PathVariable Long id,
            @Valid @RequestBody UpdateChallengeRequest request
    ) {
        ChallengeDTO challenge = challengeService.updateChallenge(id, request);
        return ResponseEntity.ok(challenge);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete challenge", description = "Soft delete a challenge (TEACHER/ADMIN only)")
    public ResponseEntity<Void> deleteChallenge(@PathVariable Long id) {
        challengeService.deleteChallenge(id);
        return ResponseEntity.noContent().build();
    }

    private Long extractUserIdFromAuthentication(Authentication authentication) {
        if (authentication == null) return null;
        Object details = authentication.getDetails();
        if (details instanceof Map<?, ?> map) {
            Object userId = map.get("userId");
            if (userId instanceof Number n) return n.longValue();
            if (userId instanceof String s) {
                try {
                    return Long.parseLong(s);
                } catch (NumberFormatException ignored) {}
            }
        }
        return null;
    }
}