package com.apiarena.authservice.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.authservice.model.entities.UserProfileBadge;

public interface UserProfileBadgeRepository extends JpaRepository<UserProfileBadge, Long> {

    boolean existsByUser_IdAndBadge_Id(Long userId, Long badgeId);

    Optional<UserProfileBadge> findByUser_IdAndBadge_Id(Long userId, Long badgeId);

    @Modifying
    @Transactional
    void deleteByBadge_Id(Long badgeId);
}
