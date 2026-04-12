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
@Table(name = "achievement_definitions", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Getter
@Setter
@NoArgsConstructor
public class AchievementDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64, unique = true)
    private String code;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Short key for UI (e.g. gate, target, mail). */
    @Column(name = "icon_key", length = 32)
    private String iconKey;

    /**
     * COMMON | RARE | EPIC | LEGEND — drives accent color in UI.
     */
    @Column(nullable = false, length = 20)
    private String tier = "COMMON";

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
