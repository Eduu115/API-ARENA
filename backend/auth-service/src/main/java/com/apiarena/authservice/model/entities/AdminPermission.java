package com.apiarena.authservice.model.entities;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;
import lombok.NoArgsConstructor;

/** One capability granted to one admin. Unique per (admin, capability). */
@Entity
@Table(name = "admin_permissions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"admin_user_id", "capability"}))
@Data @NoArgsConstructor
public class AdminPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_user_id", nullable = false)
    private Long adminUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AdminCapability capability;

    @CreationTimestamp
    @Column(name = "granted_at", updatable = false)
    private LocalDateTime grantedAt;

    @Column(name = "granted_by", length = 100)
    private String grantedBy;

    public AdminPermission(Long adminUserId, AdminCapability capability, String grantedBy) {
        this.adminUserId = adminUserId;
        this.capability = capability;
        this.grantedBy = grantedBy;
    }
}
