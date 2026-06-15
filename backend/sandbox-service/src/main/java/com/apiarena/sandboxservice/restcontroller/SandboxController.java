package com.apiarena.sandboxservice.restcontroller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.sandboxservice.model.dto.BuildRequest;
import com.apiarena.sandboxservice.model.dto.SandboxExecutionDTO;
import com.apiarena.sandboxservice.model.services.SandboxService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/internal/sandbox")
public class SandboxController {

    @Autowired
    private SandboxService sandboxService;

    @Value("${sandbox.internal-token:}")
    private String internalToken;

    @PostMapping("/build")
    public ResponseEntity<SandboxExecutionDTO> build(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @Valid @RequestBody BuildRequest request) {
        authorizeInternal(token);
        SandboxExecutionDTO result = sandboxService.buildAndRun(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping("/stop/{submissionId}")
    public ResponseEntity<SandboxExecutionDTO> stop(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @PathVariable Long submissionId) {
        authorizeInternal(token);
        return ResponseEntity.ok(sandboxService.stop(submissionId));
    }

    @GetMapping("/status/{submissionId}")
    public ResponseEntity<SandboxExecutionDTO> status(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @PathVariable Long submissionId) {
        authorizeInternal(token);
        return ResponseEntity.ok(sandboxService.getBySubmissionId(submissionId));
    }

    @GetMapping("/metrics/{containerId}")
    public ResponseEntity<SandboxExecutionDTO> metrics(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @PathVariable String containerId) {
        authorizeInternal(token);
        return ResponseEntity.ok(sandboxService.getMetrics(containerId));
    }

    private static final String DEFAULT_INTERNAL_TOKEN = "apiarena-internal-token";

    private void authorizeInternal(String token) {
        if (internalToken == null || internalToken.isBlank() || DEFAULT_INTERNAL_TOKEN.equals(internalToken)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Internal token not configured");
        }
        if (token == null || !java.security.MessageDigest.isEqual(
                internalToken.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                token.trim().getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid internal token");
        }
    }
}
