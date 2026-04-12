package com.apiarena.authservice.model.entities;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data @NoArgsConstructor

public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(min = 3, max = 50)
    @Column(unique = true, nullable = false)
    private String username;

    @NotBlank
    @Email
    @Size(max = 100)
    @Column(unique = true, nullable = false)
    private String email;

    @NotBlank
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "github_username", length = 100)
    private String githubUsername;

    @Column(nullable = false)
    private Integer rating = 1000;

    @Column(nullable = false)
    private Integer level = 1;

    @Column(name = "experience_points", nullable = false)
    private Integer experiencePoints = 0;

    @Column(name = "total_challenges_completed", nullable = false)
    private Integer totalChallengesCompleted = 0;

    @Column(name = "total_tests_passed", nullable = false)
    private Integer totalTestsPassed = 0;

    /** Cumulative seconds reported while working on challenges (start → submit), summed from submissions. */
    @Column(name = "total_development_seconds", nullable = false)
    private Long totalDevelopmentSeconds = 0L;

    /** Cumulative active browsing seconds (SPA, visible tab, not idle). */
    @Column(name = "total_browsing_seconds", nullable = false)
    private Long totalBrowsingSeconds = 0L;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "email_verified", nullable = false)
    private Boolean emailVerified = false;

    @Column(name = "email_verification_token", length = 64, unique = true)
    private String emailVerificationToken;

    @Column(name = "email_verification_expires_at")
    private LocalDateTime emailVerificationExpiresAt;

    /** Beta-phase signups: marked as legacy (early supporter) for product recognition. */
    @Column(name = "beta_legacy", nullable = false)
    private Boolean betaLegacy = true;

    public User(String username, String email, String passwordHash, Role role) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.rating = 1000;
        this.level = 1;
        this.experiencePoints = 0;
        this.totalChallengesCompleted = 0;
        this.totalTestsPassed = 0;
        this.totalDevelopmentSeconds = 0L;
        this.totalBrowsingSeconds = 0L;
        this.isActive = true;
        this.emailVerified = false;
        this.betaLegacy = true;
    }

    public enum Role {
        STUDENT,
        TEACHER,
        ADMIN
    }
}
