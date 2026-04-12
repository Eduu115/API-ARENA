package com.apiarena.authservice.restcontroller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.authservice.model.dto.DevelopmentTimeDeltaRequest;
import com.apiarena.authservice.model.dto.InternalNotificationEmailRequest;
import com.apiarena.authservice.model.dto.RewardRequest;
import com.apiarena.authservice.model.services.IUserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/internal")
public class InternalController {

    @Autowired
    private IUserService userService;

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
}
