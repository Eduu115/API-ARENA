package com.apiarena.sandboxservice.restcontroller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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

    @PostMapping("/build")
    public ResponseEntity<SandboxExecutionDTO> build(@Valid @RequestBody BuildRequest request) {
        SandboxExecutionDTO result = sandboxService.buildAndRun(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping("/stop/{submissionId}")
    public ResponseEntity<SandboxExecutionDTO> stop(@PathVariable Long submissionId) {
        return ResponseEntity.ok(sandboxService.stop(submissionId));
    }

    @GetMapping("/status/{submissionId}")
    public ResponseEntity<SandboxExecutionDTO> status(@PathVariable Long submissionId) {
        return ResponseEntity.ok(sandboxService.getBySubmissionId(submissionId));
    }

    @GetMapping("/metrics/{containerId}")
    public ResponseEntity<SandboxExecutionDTO> metrics(@PathVariable String containerId) {
        return ResponseEntity.ok(sandboxService.getMetrics(containerId));
    }
}
