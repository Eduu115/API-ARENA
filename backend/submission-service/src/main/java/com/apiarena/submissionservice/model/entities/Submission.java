package com.apiarena.submissionservice.model.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "challenge_id", nullable = false)
    private Long challengeId;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "repository_url", length = 500)
    private String repositoryUrl;

    @Column(name = "zip_file_path", length = 500)
    private String zipFilePath;

    @Column(name = "dockerfile", columnDefinition = "TEXT")
    private String dockerfile;

    @Column(name = "docker_image_hash", length = 256)
    private String dockerImageHash;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "environment_vars", columnDefinition = "jsonb")
    private Map<String, String> environmentVars;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "total_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal totalScore = BigDecimal.ZERO;

    @Column(name = "correctness_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal correctnessScore = BigDecimal.ZERO;

    @Column(name = "performance_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal performanceScore = BigDecimal.ZERO;

    @Column(name = "design_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal designScore = BigDecimal.ZERO;

    @Column(name = "ai_review_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal aiReviewScore = BigDecimal.ZERO;

    @Column(name = "avg_response_ms")
    private Integer avgResponseMs;

    @Column(name = "p95_response_ms")
    private Integer p95ResponseMs;

    @Column(name = "p99_response_ms")
    private Integer p99ResponseMs;

    @Column(name = "rps")
    private Integer rps;

    @Column(name = "total_requests")
    private Integer totalRequests;

    @Column(name = "failed_requests")
    private Integer failedRequests;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "design_issues", columnDefinition = "jsonb")
    private Map<String, Object> designIssues;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "endpoints_discovered", columnDefinition = "jsonb")
    private Map<String, Object> endpointsDiscovered;

    @Column(name = "rest_compliance_score", precision = 5, scale = 2)
    private BigDecimal restComplianceScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_suggestions", columnDefinition = "jsonb")
    private Map<String, Object> aiSuggestions;

    @Column(name = "build_logs", columnDefinition = "TEXT")
    private String buildLogs;

    @Column(name = "test_logs", columnDefinition = "TEXT")
    private String testLogs;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "replay_data", columnDefinition = "jsonb")
    private Map<String, Object> replayData;

    @Column(name = "container_id", length = 100)
    private String containerId;

    @Column(name = "api_base_url", length = 500)
    private String apiBaseUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public enum Status {
        PENDING,
        BUILDING,
        TESTING,
        COMPLETED,
        FAILED
    }
}
