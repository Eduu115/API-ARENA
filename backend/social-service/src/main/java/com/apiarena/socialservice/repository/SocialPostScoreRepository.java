package com.apiarena.socialservice.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.socialservice.model.entity.SocialPostScore;

public interface SocialPostScoreRepository extends JpaRepository<SocialPostScore, Long> {

    List<SocialPostScore> findByPostIdIn(Collection<Long> postIds);

    List<SocialPostScore> findByPostId(Long postId);

    void deleteByPostId(Long postId);
}
