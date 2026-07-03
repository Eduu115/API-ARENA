package com.apiarena.authservice.model.dto;

import java.time.LocalDateTime;

import com.apiarena.authservice.model.entities.ModerationRecord;

public record ModerationRecordDTO(
        Long id,
        String type,
        String category,
        String reason,
        String description,
        LocalDateTime bannedUntil,
        String actorEmail,
        LocalDateTime createdAt) {

    public static ModerationRecordDTO fromEntity(ModerationRecord m) {
        return new ModerationRecordDTO(m.getId(), m.getType(), m.getCategory(), m.getReason(),
                m.getDescription(), m.getBannedUntil(), m.getActorEmail(), m.getCreatedAt());
    }
}
