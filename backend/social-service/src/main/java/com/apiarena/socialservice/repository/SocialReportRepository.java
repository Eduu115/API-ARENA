package com.apiarena.socialservice.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.socialservice.model.entity.SocialReport;

public interface SocialReportRepository extends JpaRepository<SocialReport, Long> {

    Optional<SocialReport> findByTargetTypeAndTargetIdAndReporterUserId(
            String targetType, Long targetId, Long reporterUserId);

    List<SocialReport> findTop100ByOrderByCreatedAtDesc();

    List<SocialReport> findByReporterUserId(Long reporterUserId);

    void deleteByReporterUserId(Long reporterUserId);

    void deleteByTargetTypeAndTargetIdIn(String targetType, Collection<Long> targetIds);

    void deleteByTargetTypeAndTargetId(String targetType, Long targetId);
}
