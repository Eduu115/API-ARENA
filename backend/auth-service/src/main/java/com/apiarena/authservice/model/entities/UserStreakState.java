package com.apiarena.authservice.model.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_streak_state")
@Getter
@Setter
@NoArgsConstructor
public class UserStreakState {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "current_streak_weeks", nullable = false)
    private int currentStreakWeeks = 0;

    @Column(name = "longest_streak_weeks", nullable = false)
    private int longestStreakWeeks = 0;

    /** Last ISO week (year+week) that qualified for the streak. */
    @Column(name = "last_qualified_iso_year")
    private Integer lastQualifiedIsoYear;

    @Column(name = "last_qualified_iso_week")
    private Integer lastQualifiedIsoWeek;

    /** Last ISO week fully evaluated when rolling into a new week. */
    @Column(name = "last_processed_iso_year")
    private Integer lastProcessedIsoYear;

    @Column(name = "last_processed_iso_week")
    private Integer lastProcessedIsoWeek;

    public UserStreakState(Long userId) {
        this.userId = userId;
    }
}
