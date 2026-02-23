package com.apiarena.challengeservice.model.entities;

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
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "challenges")
@Data
@NoArgsConstructor
public class Challenge {

    // PAra meter listas o JSON como en mongo Usamos JdbcTypeCode para mapear el JSON como un tipo de java

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 200)
    @Column(nullable = false)
    private String title;

    @NotBlank
    @Size(max = 200)
    @Column(unique = true, nullable = false)
    private String slug;

    @NotBlank
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private Difficulty difficulty;

    @NotBlank
    @Size(max = 50)
    @Column(nullable = false)
    private String category;

    @Min(0)
    @Column(name = "max_score", nullable = false)
    private Integer maxScore = 1000;

    @Min(1)
    @Column(name = "time_limit_minutes", nullable = false)
    private Integer timeLimitMinutes = 60;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "required_endpoints", columnDefinition = "jsonb")
    private Map<String, Object> requiredEndpoints;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "required_status_codes", columnDefinition = "jsonb")
    private Map<String, Object> requiredStatusCodes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "required_headers", columnDefinition = "jsonb")
    private Map<String, Object> requiredHeaders;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "test_suite", columnDefinition = "jsonb")
    private Map<String, Object> testSuite;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "performance_requirements", columnDefinition = "jsonb")
    private Map<String, Object> performanceRequirements;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "design_criteria", columnDefinition = "jsonb")
    private Map<String, Object> designCriteria;

    @Column(name = "created_by")
    private Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(nullable = false)
    private Boolean featured = false;

    @Column(name = "times_attempted", nullable = false)
    private Integer timesAttempted = 0;

    @Column(name = "times_completed", nullable = false)
    private Integer timesCompleted = 0;

    @Column(name = "average_score", precision = 5, scale = 2)
    private BigDecimal averageScore = BigDecimal.ZERO;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> hints;

    @Column(name = "solution_explanation", columnDefinition = "TEXT")
    private String solutionExplanation;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "learning_objectives", columnDefinition = "jsonb")
    private Map<String, Object> learningObjectives;

    public enum Difficulty {
        EASY, MEDIUM, HARD, EXPERT
    }
}