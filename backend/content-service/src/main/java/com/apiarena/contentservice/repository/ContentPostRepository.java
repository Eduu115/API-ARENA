package com.apiarena.contentservice.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.contentservice.model.entities.ContentPost;
import com.apiarena.contentservice.model.entities.PostStatus;
import com.apiarena.contentservice.model.entities.PostType;

public interface ContentPostRepository extends JpaRepository<ContentPost, Long> {
    boolean existsBySlug(String slug);
    boolean existsBySlugAndIdNot(String slug, Long id);
    java.util.Optional<ContentPost> findBySlug(String slug);
    Page<ContentPost> findByTypeAndStatusOrderByPublishedAtDesc(PostType type, PostStatus status, Pageable pageable);
    Page<ContentPost> findByTypeOrderByUpdatedAtDesc(PostType type, Pageable pageable);
    Page<ContentPost> findByStatusOrderByUpdatedAtDesc(PostStatus status, Pageable pageable);
    Page<ContentPost> findAllByOrderByUpdatedAtDesc(Pageable pageable);
}
