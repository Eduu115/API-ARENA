package com.apiarena.sandboxservice.model.services;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.sandboxservice.model.dto.BuildRequest;
import com.apiarena.sandboxservice.model.dto.SandboxExecutionDTO;
import com.apiarena.sandboxservice.model.entities.SandboxExecution;
import com.apiarena.sandboxservice.repository.SandboxExecutionRepository;

@Service
public class SandboxService {

    @Autowired
    private SandboxExecutionRepository executionRepository;

    @Transactional
    public SandboxExecutionDTO buildAndRun(BuildRequest request) {
        SandboxExecution execution = new SandboxExecution();
        execution.setSubmissionId(request.getSubmissionId());
        execution.setStatus(SandboxExecution.Status.BUILDING);
        execution.setMemoryLimit("256m");
        execution.setCpuLimit(1.0);
        execution.setTimeoutSeconds(120);
        execution.setStartedAt(LocalDateTime.now());

        execution.setImageName("sandbox-" + request.getSubmissionId());
        execution.setBuildLogs("[BUILD] Received submission " + request.getSubmissionId() + "\n[BUILD] Building Docker image...\n[BUILD] Build successful");
        execution.setStatus(SandboxExecution.Status.RUNNING);
        execution.setContainerId("container-" + request.getSubmissionId() + "-" + System.currentTimeMillis());
        execution.setExposedPort(9000 + (int)(Math.random() * 1000));

        SandboxExecution saved = executionRepository.save(execution);
        return SandboxExecutionDTO.fromEntity(saved);
    }

    public SandboxExecutionDTO getBySubmissionId(Long submissionId) {
        SandboxExecution execution = executionRepository.findBySubmissionId(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Sandbox execution not found for submission: " + submissionId));
        return SandboxExecutionDTO.fromEntity(execution);
    }

    @Transactional
    public SandboxExecutionDTO stop(Long submissionId) {
        SandboxExecution execution = executionRepository.findBySubmissionId(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Sandbox execution not found for submission: " + submissionId));

        execution.setStatus(SandboxExecution.Status.STOPPED);
        execution.setFinishedAt(LocalDateTime.now());
        if (execution.getStartedAt() != null) {
            execution.setExecutionTimeMs(
                java.time.Duration.between(execution.getStartedAt(), execution.getFinishedAt()).toMillis()
            );
        }
        execution.setRuntimeLogs((execution.getRuntimeLogs() != null ? execution.getRuntimeLogs() : "") + "\n[SANDBOX] Container stopped");

        SandboxExecution saved = executionRepository.save(execution);
        return SandboxExecutionDTO.fromEntity(saved);
    }

    public SandboxExecutionDTO getMetrics(String containerId) {
        SandboxExecution execution = executionRepository.findByContainerId(containerId)
                .orElseThrow(() -> new IllegalArgumentException("Container not found: " + containerId));
        return SandboxExecutionDTO.fromEntity(execution);
    }
}
