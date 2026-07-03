package com.apiarena.authservice.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.authservice.model.entities.ModerationRecord;

public interface ModerationRecordRepository extends JpaRepository<ModerationRecord, Long> {
    List<ModerationRecord> findByUserIdOrderByCreatedAtDesc(Long userId);
}
