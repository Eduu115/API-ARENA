package com.apiarena.submissionservice.restcontroller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

import com.apiarena.submissionservice.model.dto.ChallengeAttemptStatusDTO;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.apiarena.submissionservice.config.SubmissionPrincipal;
import com.apiarena.submissionservice.model.dto.CreateSubmissionResponse;
import com.apiarena.submissionservice.model.dto.LogsResponse;
import com.apiarena.submissionservice.model.dto.ReplayTimelineResponse;
import com.apiarena.submissionservice.model.dto.SubmissionDTO;
import com.apiarena.submissionservice.model.dto.SubmissionSummaryDTO;
import com.apiarena.submissionservice.model.dto.SubmissionZipDownload;
import com.apiarena.submissionservice.model.services.ISubmissionService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/submissions")
@Tag(name = "Submissions", description = "Submission management - upload ZIP, view status, logs")
public class SubmissionController {

    @Autowired
    private ISubmissionService submissionService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create submission", description = "Upload ZIP and create a new submission")
    public ResponseEntity<CreateSubmissionResponse> createSubmission(
            @RequestParam Long challengeId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Integer developmentTimeSeconds
    ) {

        Long userId = extractUserIdFromAuthentication();
        if (userId == null) {
            throw new IllegalArgumentException("User ID not found in token. Auth service must include userId in JWT claims.");
        }

        boolean bypassRateLimit = hasAdminOrTeacherRole();
        CreateSubmissionResponse response = submissionService.createSubmission(challengeId, userId, file, bypassRateLimit,
                developmentTimeSeconds);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/challenge/{challengeId}/attempt-status")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Challenge attempt policy", description = "Cooldown and daily attempt limits for the current user")
    public ResponseEntity<ChallengeAttemptStatusDTO> getChallengeAttemptStatus(@PathVariable Long challengeId) {
        Long userId = extractUserIdFromAuthentication();
        if (userId == null) {
            throw new IllegalArgumentException("User ID not found in token.");
        }
        return ResponseEntity.ok(submissionService.getChallengeAttemptStatus(userId, challengeId));
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

    @GetMapping("/{id}/replay")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get replay timeline", description = "Get structured replay events for a submission")
    public ResponseEntity<ReplayTimelineResponse> getReplay(@PathVariable Long id) {
        Long userId = extractUserIdFromAuthentication();
        boolean isAdminOrTeacher = hasAdminOrTeacherRole();
        ReplayTimelineResponse replay = submissionService.getReplayTimeline(id, userId, isAdminOrTeacher);
        return ResponseEntity.ok(replay);
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

    @GetMapping("/teacher/students/{studentId}")
    @PreAuthorize("hasRole('TEACHER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get teacher-visible submissions for a student",
            description = "List submissions made by a student in challenges created by the current teacher")
    public ResponseEntity<List<SubmissionSummaryDTO>> getTeacherStudentSubmissions(@PathVariable Long studentId) {
        Long teacherId = extractUserIdFromAuthentication();
        if (teacherId == null) {
            throw new IllegalArgumentException("User ID not found in token.");
        }
        return ResponseEntity.ok(submissionService.getTeacherStudentSubmissions(teacherId, studentId));
    }

    @GetMapping("/teacher/students/counts")
    @PreAuthorize("hasRole('TEACHER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get teacher-visible submission counts per student",
            description = "Count submissions by student, limited to challenges created by the current teacher")
    public ResponseEntity<Map<Long, Long>> getTeacherStudentsSubmissionCounts(
            @RequestParam(name = "studentIds") List<Long> studentIds) {
        Long teacherId = extractUserIdFromAuthentication();
        if (teacherId == null) {
            throw new IllegalArgumentException("User ID not found in token.");
        }
        return ResponseEntity.ok(submissionService.getTeacherStudentsSubmissionCounts(teacherId, studentIds));
    }

    @GetMapping("/teacher/challenges/{challengeId}/submissions")
    @PreAuthorize("hasRole('TEACHER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List all submissions for a teacher-owned challenge",
            description = "Returns every submission for the challenge from any user, only if the current teacher created the challenge")
    public ResponseEntity<List<SubmissionSummaryDTO>> getTeacherChallengeSubmissions(
            @PathVariable Long challengeId) {
        Long teacherId = extractUserIdFromAuthentication();
        if (teacherId == null) {
            throw new IllegalArgumentException("User ID not found in token.");
        }
        return ResponseEntity.ok(submissionService.getTeacherChallengeSubmissions(teacherId, challengeId));
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Download submission ZIP",
            description = "Download uploaded ZIP for own submission, admin, or teacher owner of the challenge")
    public ResponseEntity<Resource> downloadSubmissionZip(@PathVariable Long id) throws IOException {
        Long userId = extractUserIdFromAuthentication();
        boolean isAdmin = hasRole("ROLE_ADMIN");
        boolean isTeacher = hasRole("ROLE_TEACHER");

        SubmissionZipDownload zd = submissionService.prepareZipDownload(id, userId, isAdmin, isTeacher);
        Path zipPath = zd.path();
        Resource resource = new UrlResource(zipPath.toUri());
        if (!resource.exists()) {
            throw new IllegalArgumentException("Submission ZIP file not found");
        }

        String filename = zipPath.getFileName() != null ? zipPath.getFileName().toString() : ("submission-" + id + ".zip");
        var builder = ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentLength(Files.size(zipPath));
        if (zd.expiresAtIso() != null && !zd.expiresAtIso().isBlank()) {
            builder = builder.header("X-Zip-Download-Expires-At", zd.expiresAtIso());
        }
        return builder.body(resource);
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
        return hasRole("ROLE_ADMIN") || hasRole("ROLE_TEACHER");
    }

    private boolean hasRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream().anyMatch(a -> role.equals(a.getAuthority()));
    }
}
