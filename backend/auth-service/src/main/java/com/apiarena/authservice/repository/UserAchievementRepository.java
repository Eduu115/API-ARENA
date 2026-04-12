package com.apiarena.authservice.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.authservice.model.entities.UserAchievement;

public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {

    boolean existsByUser_IdAndAchievement_Id(Long userId, Long achievementId);

    Optional<UserAchievement> findByUser_IdAndAchievement_Id(Long userId, Long achievementId);
}
