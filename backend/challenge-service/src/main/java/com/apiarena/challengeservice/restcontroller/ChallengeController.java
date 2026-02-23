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

import com.apiarena.challengeservice.model.dto.ChallengeDTO;
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

    // ========================================
    // ENDPOINTS PÚBLICOS (todos pueden ver)
    // ========================================

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

    @GetMapping("/{id}")
    @Operation(summary = "Get challenge by ID", description = "Get challenge details by ID")
    public ResponseEntity<ChallengeDTO> getChallengeById(@PathVariable Long id) {
        ChallengeDTO challenge = challengeService.getChallengeById(id);
        return ResponseEntity.ok(challenge);
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get challenge by slug", description = "Get challenge details by slug")
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

    // ========================================
    // ENDPOINTS PROTEGIDOS (TEACHER/ADMIN)
    // ========================================

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create challenge", description = "Create a new challenge (TEACHER/ADMIN only)")
    public ResponseEntity<ChallengeDTO> createChallenge(@Valid @RequestBody CreateChallengeRequest request) {
        // Obtener el ID del usuario autenticado
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

    // ========================================
    // UTILIDADES
    // ========================================

    private Long extractUserIdFromAuthentication(Authentication authentication) {
        // Por ahora retornamos null, esto lo implementaremos cuando tengamos
        // comunicación entre servicios o cuando el JWT incluya el userId
        // TODO: Implementar extracción de userId del JWT
        return null;
    }
}