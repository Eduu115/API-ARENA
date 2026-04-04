package com.apiarena.notificationservice.model.dto;

import java.time.Instant;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record NotificationDTO(
        Long id,
        String type,
        String importance,
        String title,
        String body,
        Map<String, Object> metadata,
        boolean read,
        Instant readAt,
        Instant createdAt
) {}
