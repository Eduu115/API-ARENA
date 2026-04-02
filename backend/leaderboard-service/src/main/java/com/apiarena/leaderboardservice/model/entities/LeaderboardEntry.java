package com.apiarena.leaderboardservice.model.entities;

import java.time.LocalDateTime;

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
@Table(name = "leaderboard_entries",
       uniqueConstraints = @UniqueConstraint(columnNames = {"challenge_id", "user_id"}))
@Data
@NoArgsConstructor
public class LeaderboardEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "challenge_id", nullable = false)
    private Long challengeId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "completion_time_seconds")
    private Integer completionTimeSeconds;

    @Column(nullable = false)
    private Integer rank = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
