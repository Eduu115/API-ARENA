package com.apiarena.authservice.model.dto;

import java.time.LocalDateTime;

import com.apiarena.authservice.model.entities.AdminAuditLog;

public record AdminAuditRowDTO(
        Long id,
        String actorEmail,
        String action,
        Long targetUserId,
        String targetUsername,
        String detail,
        LocalDateTime createdAt) {

    public static AdminAuditRowDTO fromEntity(AdminAuditLog a) {
        return new AdminAuditRowDTO(a.getId(), a.getActorEmail(), a.getAction(),
                a.getTargetUserId(), a.getTargetUsername(), a.getDetail(), a.getCreatedAt());
    }
}
