package com.apiarena.submissionservice.restcontroller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.apiarena.submissionservice.model.services.ISubmissionService;

/**
 * Internal endpoint for cross-service GDPR erasure. Protected by the shared internal
 * token (X-Internal-Token), not by user JWT.
 */
@RestController
@RequestMapping("/internal/users")
public class InternalUserDataController {

    private final ISubmissionService submissionService;

    @Value("${services.internal-token:}")
    private String internalToken;

    public InternalUserDataController(ISubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @DeleteMapping("/{userId}/data")
    public ResponseEntity<Map<String, Object>> purgeUserData(
            @PathVariable Long userId,
            @RequestHeader(value = "X-Internal-Token", required = false) String token) {
        if (internalToken == null || internalToken.isBlank() || "apiarena-internal-token".equals(internalToken)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Internal token not configured");
        }
        if (token == null || !java.security.MessageDigest.isEqual(
                internalToken.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                token.getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid internal token");
        }
        int removed = submissionService.purgeUserData(userId);
        return ResponseEntity.ok(Map.of("userId", userId, "submissionsRemoved", removed));
    }
}
