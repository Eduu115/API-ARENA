package com.apiarena.authservice.model.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_profile_badges", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "badge_id"}))
@Getter
@Setter
@NoArgsConstructor
public class UserProfileBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "badge_id", nullable = false)
    private ProfileBadgeDefinition badge;

    @Column(name = "unlocked_at", nullable = false)
    private LocalDateTime unlockedAt;
}
