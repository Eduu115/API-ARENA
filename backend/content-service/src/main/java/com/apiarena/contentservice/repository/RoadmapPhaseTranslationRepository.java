package com.apiarena.contentservice.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.contentservice.model.entities.PhaseLocaleKey;
import com.apiarena.contentservice.model.entities.RoadmapPhaseTranslation;

public interface RoadmapPhaseTranslationRepository extends JpaRepository<RoadmapPhaseTranslation, PhaseLocaleKey> {
    List<RoadmapPhaseTranslation> findByPhaseIdIn(Collection<Long> phaseIds);
}
