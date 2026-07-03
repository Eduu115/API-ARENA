package com.apiarena.submissionservice.restcontroller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.submissionservice.model.dto.AdminSubmissionRowDTO;
import com.apiarena.submissionservice.model.services.ISubmissionService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Admin console: read any user's submissions. Full detail of a single submission reuses the
 * existing {@code GET /api/submissions/{id}} (already ADMIN-aware).
 */
@RestController
@RequestMapping("/api/submissions/admin")
@Tag(name = "Admin Submissions", description = "Admin console — user submissions with time-to-submit")
public class AdminSubmissionController {

    @Autowired
    private ISubmissionService submissionService;

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "User submissions (admin)", description = "All submissions of a user, including time-to-submit")
    public ResponseEntity<List<AdminSubmissionRowDTO>> getUserSubmissions(@PathVariable Long userId) {
        return ResponseEntity.ok(submissionService.getUserSubmissionsForAdmin(userId));
    }
}
