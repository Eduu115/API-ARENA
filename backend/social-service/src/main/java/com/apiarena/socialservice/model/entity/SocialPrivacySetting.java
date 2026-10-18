package com.apiarena.socialservice.model.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "social_privacy_settings")
@Data
@NoArgsConstructor
public class SocialPrivacySetting {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "activity_visibility", nullable = false, length = 20)
    private String activityVisibility = "FRIENDS";

    @Column(name = "friend_post_notifications", nullable = false)
    private boolean friendPostNotifications = true;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
