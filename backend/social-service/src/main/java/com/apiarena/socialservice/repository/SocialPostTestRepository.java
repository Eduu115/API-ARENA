package com.apiarena.socialservice.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.socialservice.model.entity.SocialPostTestResult;

public interface SocialPostTestRepository extends JpaRepository<SocialPostTestResult, Long> {

    List<SocialPostTestResult> findByPostIdIn(Collection<Long> postIds);

    List<SocialPostTestResult> findByPostId(Long postId);

    void deleteByPostId(Long postId);
}
