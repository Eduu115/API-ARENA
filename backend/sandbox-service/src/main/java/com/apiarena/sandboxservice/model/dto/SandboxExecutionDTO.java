package com.apiarena.sandboxservice.model.dto;

import java.time.LocalDateTime;

import com.apiarena.sandboxservice.model.entities.SandboxExecution;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SandboxExecutionDTO {

    private Long id;
    private Long submissionId;
    private String containerId;
    private String status;
    private Integer exposedPort;
    private String buildLogs;
    private String runtimeLogs;
    private String errorMessage;
    private Long executionTimeMs;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;

    public static SandboxExecutionDTO fromEntity(SandboxExecution entity) {
        return SandboxExecutionDTO.builder()
                .id(entity.getId())
                .submissionId(entity.getSubmissionId())
                .containerId(entity.getContainerId())
                .status(entity.getStatus().name())
                .exposedPort(entity.getExposedPort())
                .buildLogs(entity.getBuildLogs())
                .runtimeLogs(entity.getRuntimeLogs())
                .errorMessage(entity.getErrorMessage())
                .executionTimeMs(entity.getExecutionTimeMs())
                .createdAt(entity.getCreatedAt())
                .startedAt(entity.getStartedAt())
                .finishedAt(entity.getFinishedAt())
                .build();
    }
}
