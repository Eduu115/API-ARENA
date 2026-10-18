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
@Table(name = "social_activity_entries", uniqueConstraints = @UniqueConstraint(columnNames = "source_event_id"))
@Data
@NoArgsConstructor
public class SocialActivityEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "activity_type", nullable = false, length = 40)
    private String activityType;

    @Column(name = "source_event_id", nullable = false, length = 180)
    private String sourceEventId;

    @Column(name = "challenge_id")
    private Long challengeId;

    @Column(name = "challenge_title", length = 200)
    private String challengeTitle;

    private Integer score;

    @Column(name = "previous_value")
    private Integer previousValue;

    @Column(name = "new_value")
    private Integer newValue;

    private Integer delta;

    @Column(name = "label_before", length = 40)
    private String labelBefore;

    @Column(name = "label_after", length = 40)
    private String labelAfter;

    @Column(name = "achievement_code", length = 80)
    private String achievementCode;

    @Column(name = "achievement_title", length = 200)
    private String achievementTitle;

    @Column(name = "streak_weeks")
    private Integer streakWeeks;

    @Column(nullable = false)
    private boolean hidden = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
