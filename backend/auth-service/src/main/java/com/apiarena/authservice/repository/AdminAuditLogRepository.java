package com.apiarena.authservice.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.authservice.model.entities.AdminAuditLog;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {
    Page<AdminAuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
