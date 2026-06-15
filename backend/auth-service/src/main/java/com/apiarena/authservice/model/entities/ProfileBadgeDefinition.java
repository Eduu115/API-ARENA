package com.apiarena.authservice.model.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "profile_badge_definitions", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Getter
@Setter
@NoArgsConstructor
public class ProfileBadgeDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64, unique = true)
    private String code;

    /** Short label shown on the profile chip (e.g. Alpha, Level V). */
    @Column(name = "display_label", nullable = false, length = 48)
    private String displayLabel;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** CSS style key suffix (profile-badge--{styleKey}). */
    @Column(name = "style_key", nullable = false, length = 32)
    private String styleKey;

    @Column(nullable = false, length = 20)
    private String tier = "COMMON";

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
