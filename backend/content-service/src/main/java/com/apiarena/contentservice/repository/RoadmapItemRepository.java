package com.apiarena.contentservice.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.contentservice.model.entities.RoadmapItem;

public interface RoadmapItemRepository extends JpaRepository<RoadmapItem, Long> {
    List<RoadmapItem> findByPhaseIdInOrderByPositionAsc(Collection<Long> phaseIds);
}
