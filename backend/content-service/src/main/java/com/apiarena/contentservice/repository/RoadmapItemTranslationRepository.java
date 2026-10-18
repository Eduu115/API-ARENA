package com.apiarena.contentservice.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.contentservice.model.entities.ItemLocaleKey;
import com.apiarena.contentservice.model.entities.RoadmapItemTranslation;

public interface RoadmapItemTranslationRepository extends JpaRepository<RoadmapItemTranslation, ItemLocaleKey> {
    List<RoadmapItemTranslation> findByItemIdIn(Collection<Long> itemIds);
}
