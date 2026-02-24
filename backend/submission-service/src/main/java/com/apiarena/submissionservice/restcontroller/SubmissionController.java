package com.apiarena.submissionservice.restcontroller;

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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.apiarena.submissionservice.config.SubmissionPrincipal;
import com.apiarena.submissionservice.model.dto.CreateSubmissionResponse;
import com.apiarena.submissionservice.model.dto.LogsResponse;
import com.apiarena.submissionservice.model.dto.SubmissionDTO;
import com.apiarena.submissionservice.model.dto.SubmissionSummaryDTO;
import com.apiarena.submissionservice.model.services.SubmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/submissions")
@Tag(name = "Submissions", description = "Submission management - upload ZIP, view status, logs")
public class SubmissionController {

    @Autowired
    private SubmissionService submissionService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create submission", description = "Upload ZIP and create a new submission")
    public ResponseEntity<CreateSubmissionResponse> createSubmission(
            @RequestParam Long challengeId,
            @RequestParam("file") MultipartFile file
    ) {

        Long userId = extractUserIdFromAuthentication();
        if (userId == null) {
            throw new IllegalArgumentException("User ID not found in token. Auth service must include userId in JWT claims.");
        }

        CreateSubmissionResponse response = submissionService.createSubmission(challengeId, userId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get submission by ID", description = "Get submission detail (ownership or ADMIN/TEACHER)")
    public ResponseEntity<SubmissionDTO> getSubmissionById(@PathVariable Long id) {
        Long userId = extractUserIdFromAuthentication();
        boolean isAdminOrTeacher = hasAdminOrTeacherRole();
        SubmissionDTO dto = submissionService.getSubmissionById(id, userId, isAdminOrTeacher);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}/logs")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get submission logs", description = "Get build and test logs")
    public ResponseEntity<LogsResponse> getLogs(@PathVariable Long id) {
        Long userId = extractUserIdFromAuthentication();
        boolean isAdminOrTeacher = hasAdminOrTeacherRole();
        LogsResponse logs = submissionService.getLogs(id, userId, isAdminOrTeacher);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get my submissions", description = "List current user's submissions")
    public ResponseEntity<List<SubmissionSummaryDTO>> getMySubmissions() {
        Long userId = extractUserIdFromAuthentication();
        if (userId == null) {
            throw new IllegalArgumentException("User ID not found in token.");
        }
        List<SubmissionSummaryDTO> submissions = submissionService.getMySubmissions(userId);
        return ResponseEntity.ok(submissions);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete submission", description = "Delete own submission (or ADMIN/TEACHER)")
    public ResponseEntity<Void> deleteSubmission(@PathVariable Long id) {
        Long userId = extractUserIdFromAuthentication();
        boolean isAdminOrTeacher = hasAdminOrTeacherRole();
        submissionService.deleteSubmission(id, userId, isAdminOrTeacher);
        return ResponseEntity.noContent().build();
    }

    private Long extractUserIdFromAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof SubmissionPrincipal p) {
            return p.getUserId();
        }
        return null;
    }

    private boolean hasAdminOrTeacherRole() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()) || "ROLE_TEACHER".equals(a.getAuthority()));
    }
}
