package com.apiarena.submissionservice.restcontroller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.http.HttpStatus;

import com.apiarena.submissionservice.model.services.ISubmissionService;

/** Safe score/test-name snapshot for social-service. No ZIP, logs, payloads, or challenge specs. */
@RestController
@RequestMapping("/internal/submissions")
public class InternalSocialSnapshotController {

    private static final String DEFAULT_INTERNAL_TOKEN = "apiarena-internal-token";

    private final ISubmissionService submissionService;

    @Value("${services.internal-token:}")
    private String internalToken;

    public InternalSocialSnapshotController(ISubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @GetMapping("/{submissionId}/social-snapshot")
    public ResponseEntity<Map<String, Object>> snapshot(
            @PathVariable Long submissionId,
            @RequestHeader(value = "X-Internal-Token", required = false) String token) {
        if (internalToken == null || internalToken.isBlank() || DEFAULT_INTERNAL_TOKEN.equals(internalToken)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Internal token not configured");
        }
        if (token == null || !java.security.MessageDigest.isEqual(
                internalToken.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                token.trim().getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid internal token");
        }
        return ResponseEntity.ok(submissionService.socialSnapshot(submissionId));
    }
}
