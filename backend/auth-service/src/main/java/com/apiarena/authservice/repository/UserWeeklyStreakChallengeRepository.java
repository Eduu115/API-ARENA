package com.apiarena.authservice.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.apiarena.authservice.model.entities.UserWeeklyStreakChallenge;

public interface UserWeeklyStreakChallengeRepository extends JpaRepository<UserWeeklyStreakChallenge, Long> {

    boolean existsByUserIdAndIsoYearAndIsoWeekAndChallengeId(
            Long userId, int isoYear, int isoWeek, Long challengeId);

    List<UserWeeklyStreakChallenge> findByUserIdAndIsoYearAndIsoWeek(
            Long userId, int isoYear, int isoWeek);

    @Query("""
            SELECT c.challengeId FROM UserWeeklyStreakChallenge c
            WHERE c.userId = :userId
            AND (c.isoYear * 100 + c.isoWeek) IN :yearWeekKeys
            """)
    List<Long> findChallengeIdsByUserIdAndYearWeekKeys(
            @Param("userId") Long userId,
            @Param("yearWeekKeys") List<Integer> yearWeekKeys);
}
