package com.apiarena.authservice.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.authservice.model.entities.ProfileBadgeDefinition;

public interface ProfileBadgeDefinitionRepository extends JpaRepository<ProfileBadgeDefinition, Long> {

    Optional<ProfileBadgeDefinition> findByCode(String code);

    List<ProfileBadgeDefinition> findAllByOrderBySortOrderAsc();
}
