package com.apiarena.notificationservice.model.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record NotificationWebSocketMessage(
        String event,
        NotificationDTO notification,
        long unreadCount
) {}
