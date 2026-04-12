package com.apiarena.authservice.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.authservice.model.entities.AchievementDefinition;

public interface AchievementDefinitionRepository extends JpaRepository<AchievementDefinition, Long> {

    Optional<AchievementDefinition> findByCode(String code);

    List<AchievementDefinition> findAllByOrderBySortOrderAsc();
}
