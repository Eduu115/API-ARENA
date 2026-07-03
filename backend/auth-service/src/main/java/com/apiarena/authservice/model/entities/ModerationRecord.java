package com.apiarena.authservice.model.entities;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

/** One ban or unban event, with the form answers, for consultation + analytics. */
@Entity
@Table(name = "moderation_record")
@Data
@NoArgsConstructor
public class ModerationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** BAN | UNBAN */
    @Column(nullable = false, length = 10)
    private String type;

    /** Ban classification for analytics (e.g. CHEATING, TOXICITY). Null on unbans / uncategorized. */
    @Column(length = 40)
    private String category;

    @Column(nullable = false, length = 120)
    private String reason;

    @Column(length = 500)
    private String description;

    /** Ban expiry captured on the record (null = permanent / unban). */
    @Column(name = "banned_until")
    private LocalDateTime bannedUntil;

    @Column(name = "actor_email", nullable = false, length = 120)
    private String actorEmail;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public ModerationRecord(Long userId, String type, String category, String reason, String description,
            LocalDateTime bannedUntil, String actorEmail) {
        this.userId = userId;
        this.type = type;
        this.category = category;
        this.reason = reason;
        this.description = description;
        this.bannedUntil = bannedUntil;
        this.actorEmail = actorEmail;
    }
}
