package com.apiarena.socialservice.model.entity;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "social_posts", uniqueConstraints = @UniqueConstraint(columnNames = "submission_id"))
@Data
@NoArgsConstructor
public class SocialPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    @Column(name = "challenge_id")
    private Long challengeId;

    @Column(name = "challenge_title", length = 200)
    private String challengeTitle;

    @Column(length = 500)
    private String caption;

    @Column(name = "total_score", nullable = false)
    private Integer totalScore;

    @Column(name = "technical_score", nullable = false)
    private Integer technicalScore = 0;

    @Column(name = "ai_score", nullable = false)
    private Integer aiScore = 0;

    @Column(name = "tests_passed", nullable = false)
    private Integer testsPassed = 0;

    @Column(name = "tests_failed", nullable = false)
    private Integer testsFailed = 0;

    @Column(name = "avg_response_ms")
    private Integer avgResponseMs;

    @Column(name = "p95_response_ms")
    private Integer p95ResponseMs;

    @Column(name = "p99_response_ms")
    private Integer p99ResponseMs;

    private Integer rps;

    @Column(nullable = false)
    private boolean hidden = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
