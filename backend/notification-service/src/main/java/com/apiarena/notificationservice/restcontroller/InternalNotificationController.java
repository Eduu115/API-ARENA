package com.apiarena.notificationservice.restcontroller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.apiarena.notificationservice.model.dto.InternalAchievementUnlockedRequest;
import com.apiarena.notificationservice.model.dto.InternalTeacherSubmissionReviewRequest;
import com.apiarena.notificationservice.model.dto.InternalWelcomeRequest;
import com.apiarena.notificationservice.model.services.NotificationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/internal/notifications")
public class InternalNotificationController {

    private static final String DEFAULT_INTERNAL_TOKEN = "apiarena-internal-token";

    private final NotificationService notificationService;

    @Value("${services.internal-token:}")
    private String internalToken;

    public InternalNotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/welcome")
    public ResponseEntity<Void> welcome(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @Valid @RequestBody InternalWelcomeRequest body) {
        authorizeInternal(token);
        notificationService.createWelcomeNotification(body.userId(), body.username());
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/teacher-submission-review")
    public ResponseEntity<Void> teacherSubmissionReview(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @Valid @RequestBody InternalTeacherSubmissionReviewRequest body) {
        authorizeInternal(token);
        notificationService.createTeacherSubmissionReviewNotification(body);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/achievement-unlocked")
    public ResponseEntity<Void> achievementUnlocked(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @Valid @RequestBody InternalAchievementUnlockedRequest body) {
        authorizeInternal(token);
        notificationService.createAchievementUnlockedNotification(body);
        return ResponseEntity.accepted().build();
    }

    private void authorizeInternal(String token) {
        if (internalToken == null || internalToken.isBlank() || DEFAULT_INTERNAL_TOKEN.equals(internalToken)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Internal token not configured");
        }
        if (token == null || !java.security.MessageDigest.isEqual(
                internalToken.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                token.trim().getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid internal token");
        }
    }
}
