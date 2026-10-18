package com.apiarena.contentservice.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.apiarena.contentservice.model.entities.ContentPostTag;

public interface ContentPostTagRepository extends JpaRepository<ContentPostTag, Long> {
    List<ContentPostTag> findByPostIdIn(Collection<Long> postIds);

    @Modifying(flushAutomatically = true)
    @Query("delete from ContentPostTag link where link.post.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);
}
