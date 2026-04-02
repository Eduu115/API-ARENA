package com.apiarena.sandboxservice.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.sandboxservice.model.entities.SandboxExecution;

public interface SandboxExecutionRepository extends JpaRepository<SandboxExecution, Long> {
    Optional<SandboxExecution> findBySubmissionId(Long submissionId);
    List<SandboxExecution> findByStatus(SandboxExecution.Status status);
    Optional<SandboxExecution> findByContainerId(String containerId);
}
