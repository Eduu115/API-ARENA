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
@Table(name = "user_weekly_streak_challenges", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "iso_year", "iso_week", "challenge_id" })
})
@Getter
@Setter
@NoArgsConstructor
public class UserWeeklyStreakChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "iso_year", nullable = false)
    private int isoYear;

    @Column(name = "iso_week", nullable = false)
    private int isoWeek;

    @Column(name = "challenge_id", nullable = false)
    private Long challengeId;

    public UserWeeklyStreakChallenge(Long userId, int isoYear, int isoWeek, Long challengeId) {
        this.userId = userId;
        this.isoYear = isoYear;
        this.isoWeek = isoWeek;
        this.challengeId = challengeId;
    }
}
