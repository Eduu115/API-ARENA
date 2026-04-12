package com.apiarena.submissionservice.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.submissionservice.model.entities.ReplayEvent;

public interface ReplayEventRepository extends JpaRepository<ReplayEvent, Long> {

    List<ReplayEvent> findBySubmissionIdOrderByOccurredAtAscIdAsc(Long submissionId);

    @Transactional
    long deleteByOccurredAtBefore(LocalDateTime cutoff);
}
