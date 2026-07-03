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

/** One row per admin console action (moderation, role change, impersonation, deletion, …). */
@Entity
@Table(name = "admin_audit_log")
@Data
@NoArgsConstructor
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_email", nullable = false, length = 120)
    private String actorEmail;

    @Column(nullable = false, length = 60)
    private String action;

    @Column(name = "target_user_id")
    private Long targetUserId;

    @Column(name = "target_username", length = 60)
    private String targetUsername;

    @Column(length = 500)
    private String detail;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public AdminAuditLog(String actorEmail, String action, Long targetUserId, String targetUsername, String detail) {
        this.actorEmail = actorEmail;
        this.action = action;
        this.targetUserId = targetUserId;
        this.targetUsername = targetUsername;
        this.detail = detail;
    }
}
