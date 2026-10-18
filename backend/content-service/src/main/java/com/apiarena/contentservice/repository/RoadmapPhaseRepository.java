package com.apiarena.contentservice.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.contentservice.model.entities.RoadmapPhase;

public interface RoadmapPhaseRepository extends JpaRepository<RoadmapPhase, Long> {
    List<RoadmapPhase> findAllByOrderByPositionAsc();
}
