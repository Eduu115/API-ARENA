package com.apiarena.contentservice.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.contentservice.model.entities.ContentPostTranslation;

public interface ContentPostTranslationRepository extends JpaRepository<ContentPostTranslation, Long> {
    List<ContentPostTranslation> findByPostIdIn(Collection<Long> postIds);
    Optional<ContentPostTranslation> findByPostIdAndLocale(Long postId, String locale);
}
