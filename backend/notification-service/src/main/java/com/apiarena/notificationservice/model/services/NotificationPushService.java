package com.apiarena.notificationservice.model.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.apiarena.notificationservice.model.dto.NotificationDTO;
import com.apiarena.notificationservice.model.dto.NotificationWebSocketMessage;
import com.apiarena.notificationservice.websocket.NotificationWebSocketHandler;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class NotificationPushService {

    private static final Logger log = LoggerFactory.getLogger(NotificationPushService.class);

    private final NotificationWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;

    public NotificationPushService(NotificationWebSocketHandler webSocketHandler, ObjectMapper objectMapper) {
        this.webSocketHandler = webSocketHandler;
        this.objectMapper = objectMapper;
    }

    public void pushNewNotification(Long userId, NotificationDTO dto, long unreadCount) {
        try {
            NotificationWebSocketMessage msg = new NotificationWebSocketMessage("NEW_NOTIFICATION", dto, unreadCount);
            String json = objectMapper.writeValueAsString(msg);
            webSocketHandler.sendToUser(userId, json);
        } catch (Exception e) {
            log.debug("WebSocket push skipped or failed for user {}: {}", userId, e.getMessage());
        }
    }
}
