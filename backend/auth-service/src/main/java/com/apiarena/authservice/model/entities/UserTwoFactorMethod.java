package com.apiarena.authservice.model.entities;

import java.time.LocalDateTime;

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

/** One second-factor method per user. At most one row is primary. */
@Entity
@Table(name = "user_two_factor_methods",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_user_two_factor_methods_user_method",
                columnNames = {"user_id", "method"}))
@Data
@NoArgsConstructor
public class UserTwoFactorMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private TwoFactorMethodKind method;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "is_primary", nullable = false)
    private boolean primary;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
