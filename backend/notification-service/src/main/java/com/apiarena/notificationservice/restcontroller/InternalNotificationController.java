package com.apiarena.notificationservice.restcontroller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.notificationservice.model.dto.InternalAchievementUnlockedRequest;
import com.apiarena.notificationservice.model.dto.InternalTeacherSubmissionReviewRequest;
import com.apiarena.notificationservice.model.dto.InternalWelcomeRequest;
import com.apiarena.notificationservice.model.services.NotificationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/internal/notifications")
public class InternalNotificationController {

    private final NotificationService notificationService;

    public InternalNotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/welcome")
    public ResponseEntity<Void> welcome(@Valid @RequestBody InternalWelcomeRequest body) {
        notificationService.createWelcomeNotification(body.userId(), body.username());
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/teacher-submission-review")
    public ResponseEntity<Void> teacherSubmissionReview(@Valid @RequestBody InternalTeacherSubmissionReviewRequest body) {
        notificationService.createTeacherSubmissionReviewNotification(body);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/achievement-unlocked")
    public ResponseEntity<Void> achievementUnlocked(@Valid @RequestBody InternalAchievementUnlockedRequest body) {
        notificationService.createAchievementUnlockedNotification(body);
        return ResponseEntity.accepted().build();
    }
}
