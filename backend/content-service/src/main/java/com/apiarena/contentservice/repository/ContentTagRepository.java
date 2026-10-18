package com.apiarena.contentservice.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.contentservice.model.entities.ContentTag;

public interface ContentTagRepository extends JpaRepository<ContentTag, Long> {
    Optional<ContentTag> findBySlug(String slug);
}
