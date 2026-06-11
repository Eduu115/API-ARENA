package com.apiarena.authservice.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.authservice.model.entities.UserStreakState;

public interface UserStreakStateRepository extends JpaRepository<UserStreakState, Long> {
    Optional<UserStreakState> findByUserId(Long userId);
}
