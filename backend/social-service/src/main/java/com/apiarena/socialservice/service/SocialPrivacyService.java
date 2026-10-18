package com.apiarena.socialservice.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.apiarena.socialservice.domain.FeedVisibility;
import com.apiarena.socialservice.model.entity.SocialPrivacySetting;
import com.apiarena.socialservice.repository.SocialPrivacyRepository;

@Service
public class SocialPrivacyService {

    private final SocialPrivacyRepository privacyRepository;

    public SocialPrivacyService(SocialPrivacyRepository privacyRepository) {
        this.privacyRepository = privacyRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> get(long userId) {
        SocialPrivacySetting row = privacyRepository.findById(userId).orElse(null);
        return toMap(row, userId);
    }

    @Transactional
    public Map<String, Object> update(long userId, String visibility, Boolean friendPostNotifications) {
        if (visibility != null && !FeedVisibility.FRIENDS.equals(FeedVisibility.normalize(visibility))
                && !FeedVisibility.PRIVATE.equalsIgnoreCase(visibility.trim())
                && !"FRIENDS".equalsIgnoreCase(visibility.trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown visibility");
        }
        SocialPrivacySetting row = privacyRepository.findById(userId).orElseGet(() -> {
            SocialPrivacySetting created = new SocialPrivacySetting();
            created.setUserId(userId);
            return created;
        });
        if (visibility != null) {
            row.setActivityVisibility(FeedVisibility.normalize(visibility));
        }
        if (friendPostNotifications != null) {
            row.setFriendPostNotifications(friendPostNotifications);
        }
        row.setUpdatedAt(Instant.now());
        return toMap(privacyRepository.save(row), userId);
    }

    private static Map<String, Object> toMap(SocialPrivacySetting row, long userId) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("userId", userId);
        out.put("activityVisibility", row == null ? FeedVisibility.FRIENDS : FeedVisibility.normalize(row.getActivityVisibility()));
        out.put("friendPostNotifications", row == null || row.isFriendPostNotifications());
        return out;
    }
}
