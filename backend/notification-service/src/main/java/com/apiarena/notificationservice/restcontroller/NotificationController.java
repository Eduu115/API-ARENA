package com.apiarena.notificationservice.restcontroller;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.notificationservice.model.dto.NotificationDTO;
import com.apiarena.notificationservice.model.dto.UnreadCountDTO;
import com.apiarena.notificationservice.model.entities.NotificationImportance;
import com.apiarena.notificationservice.model.services.NotificationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications", description = "In-app notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List my notifications")
    public ResponseEntity<Page<NotificationDTO>> listMine(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean unreadOnly,
            @RequestParam(required = false) String minImportance
    ) {
        Long userId = extractUserId(authentication);
        if (userId == null) {
            throw new IllegalArgumentException("User ID not found in token");
        }
        NotificationImportance min = parseMinImportance(minImportance);
        var pageable = PageRequest.of(page, Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(notificationService.listForUser(userId, unreadOnly, min, pageable));
    }

    private static NotificationImportance parseMinImportance(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return NotificationImportance.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "minImportance must be one of: INFO, REMINDER, ALERTS, IMPORTANT");
        }
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Unread notification count")
    public ResponseEntity<UnreadCountDTO> unreadCount(Authentication authentication) {
        Long userId = extractUserId(authentication);
        if (userId == null) {
            throw new IllegalArgumentException("User ID not found in token");
        }
        return ResponseEntity.ok(new UnreadCountDTO(notificationService.countUnread(userId)));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Mark one notification as read")
    public ResponseEntity<NotificationDTO> markRead(
            Authentication authentication,
            @PathVariable Long id
    ) {
        Long userId = extractUserId(authentication);
        if (userId == null) {
            throw new IllegalArgumentException("User ID not found in token");
        }
        return ResponseEntity.ok(notificationService.markRead(userId, id));
    }

    @PostMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<Map<String, Integer>> markAllRead(Authentication authentication) {
        Long userId = extractUserId(authentication);
        if (userId == null) {
            throw new IllegalArgumentException("User ID not found in token");
        }
        int updated = notificationService.markAllRead(userId);
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    private Long extractUserId(Authentication authentication) {
        if (authentication == null) return null;
        Object details = authentication.getDetails();
        if (details instanceof Map<?, ?> map) {
            Object userId = map.get("userId");
            if (userId instanceof Number n) return n.longValue();
            if (userId instanceof String s) {
                try {
                    return Long.parseLong(s);
                } catch (NumberFormatException ignored) {
                    return null;
                }
            }
        }
        return null;
    }
}
