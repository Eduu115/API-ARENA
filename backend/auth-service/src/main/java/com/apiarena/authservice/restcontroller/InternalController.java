package com.apiarena.authservice.restcontroller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.apiarena.authservice.model.dto.DevelopmentTimeDeltaRequest;
import com.apiarena.authservice.model.dto.InternalNotificationEmailRequest;
import com.apiarena.authservice.model.dto.NewChallengePublishedRequest;
import com.apiarena.authservice.model.dto.RewardRequest;
import com.apiarena.authservice.model.services.IUserService;
import com.apiarena.authservice.model.services.TeacherGroupService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/internal")
public class InternalController {

    @Autowired
    private IUserService userService;

    @Autowired
    private TeacherGroupService teacherGroupService;

    @Value("${services.internal-token:}")
    private String internalServiceToken;

    @PostMapping("/users/{id}/reward")
    public ResponseEntity<Void> applyReward(@PathVariable Long id, @RequestBody RewardRequest request) {
        userService.applyReward(id, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users/{id}/development-time")
    public ResponseEntity<Void> addDevelopmentTime(
            @PathVariable Long id,
            @Valid @RequestBody DevelopmentTimeDeltaRequest request) {
        userService.addDevelopmentTimeSeconds(id, request.getSeconds());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users/{id}/notification-email")
    public ResponseEntity<Void> sendNotificationEmail(
            @PathVariable Long id,
            @Valid @RequestBody InternalNotificationEmailRequest request
    ) {
        userService.sendNotificationEmail(id, request.title(), request.body(), request.importance());
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/challenges/new-published")
    public ResponseEntity<Void> onNewChallengePublished(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @Valid @RequestBody NewChallengePublishedRequest body) {
        requireInternalToken(token);
        userService.notifyNewChallengeEmailSubscribers(
                body.getChallengeId(),
                body.getTitle(),
                body.getCreatedByUserId());
        return ResponseEntity.accepted().build();
    }

    /**
     * Used by submission-service to decide if manual grading is allowed (student in a group of this teacher).
     */
    @GetMapping("/teachers/{teacherId}/students/{studentUserId}/in-group")
    public ResponseEntity<Map<String, Boolean>> isStudentInTeacherGroup(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @PathVariable Long teacherId,
            @PathVariable Long studentUserId) {
        requireInternalToken(token);
        boolean inGroup = teacherGroupService.isStudentInAnyTeacherGroup(teacherId, studentUserId);
        return ResponseEntity.ok(Map.of("inGroup", inGroup));
    }

    private void requireInternalToken(String token) {
        if (internalServiceToken == null || internalServiceToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Internal service token is not configured");
        }
        if (token == null || !internalServiceToken.equals(token.trim())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid internal token");
        }
    }
}
