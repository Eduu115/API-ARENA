package com.apiarena.authservice.model.entities;

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

/**
 * Tombstone + archive for a deleted account. The live account is freed on delete; this row reserves the
 * email and holds a JSON snapshot until {@code purgeAfter}, when a scheduled job removes it for good.
 */
@Entity
@Table(name = "account_deletions", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
@Data @NoArgsConstructor
public class AccountDeletion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(length = 50)
    private String username;

    /** Opaque GDPR archive (the JSON data export). Never queried by field — kept whole, then purged. */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String snapshot;

    @CreationTimestamp
    @Column(name = "requested_at", updatable = false)
    private LocalDateTime requestedAt;

    @Column(name = "purge_after", nullable = false)
    private LocalDateTime purgeAfter;

    public AccountDeletion(String email, String username, String snapshot, LocalDateTime purgeAfter) {
        this.email = email;
        this.username = username;
        this.snapshot = snapshot;
        this.purgeAfter = purgeAfter;
    }
}
