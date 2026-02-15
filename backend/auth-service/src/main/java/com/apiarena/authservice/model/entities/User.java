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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "users")
@Data @NoArgsConstructor @AllArgsConstructor @Builder

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

    @Builder.Default
    @Column(nullable = false)
    private Integer rating = 1000;

    @Builder.Default
    @Column(nullable = false)
    private Integer level = 1;

    @Builder.Default
    @Column(name = "experience_points", nullable = false)
    private Integer experiencePoints = 0;

    @Builder.Default
    @Column(name = "total_challenges_completed", nullable = false)
    private Integer totalChallengesCompleted = 0;

    @Builder.Default
    @Column(name = "total_tests_passed", nullable = false)
    private Integer totalTestsPassed = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "email_verified", nullable = false)
    private Boolean emailVerified = false;

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
        this.isActive = true;
        this.emailVerified = false;
    }

    public enum Role {
        STUDENT,
        TEACHER,
        ADMIN
    }
}
