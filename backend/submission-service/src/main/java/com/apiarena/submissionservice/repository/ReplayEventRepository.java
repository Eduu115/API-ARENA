package com.apiarena.submissionservice.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.submissionservice.model.entities.ReplayEvent;

public interface ReplayEventRepository extends JpaRepository<ReplayEvent, Long> {

    List<ReplayEvent> findBySubmissionIdOrderByOccurredAtAscIdAsc(Long submissionId);
}
