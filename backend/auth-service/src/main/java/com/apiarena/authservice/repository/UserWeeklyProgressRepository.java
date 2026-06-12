package com.apiarena.authservice.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.apiarena.authservice.model.entities.UserWeeklyProgress;

public interface UserWeeklyProgressRepository extends JpaRepository<UserWeeklyProgress, Long> {

    Optional<UserWeeklyProgress> findByUserIdAndIsoYearAndIsoWeek(Long userId, int isoYear, int isoWeek);

    @Query("""
            SELECT p FROM UserWeeklyProgress p
            WHERE p.userId = :userId
            AND (p.isoYear * 100 + p.isoWeek) IN :yearWeekKeys
            """)
    List<UserWeeklyProgress> findByUserIdAndYearWeekKeys(
            @Param("userId") Long userId,
            @Param("yearWeekKeys") List<Integer> yearWeekKeys);
}
