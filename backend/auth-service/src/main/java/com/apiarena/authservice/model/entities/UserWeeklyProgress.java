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
@Table(name = "user_weekly_progress", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "iso_year", "iso_week" })
})
@Getter
@Setter
@NoArgsConstructor
public class UserWeeklyProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "iso_year", nullable = false)
    private int isoYear;

    @Column(name = "iso_week", nullable = false)
    private int isoWeek;

    @Column(name = "xp_earned", nullable = false)
    private int xpEarned = 0;

    @Column(name = "qualifying_distinct_count", nullable = false)
    private int qualifyingDistinctCount = 0;

    @Column(name = "qualified", nullable = false)
    private boolean qualified = false;

    /** XP, RUNS, or BOTH */
    @Column(name = "qualified_via", length = 8)
    private String qualifiedVia;

    public UserWeeklyProgress(Long userId, int isoYear, int isoWeek) {
        this.userId = userId;
        this.isoYear = isoYear;
        this.isoWeek = isoWeek;
    }
}
