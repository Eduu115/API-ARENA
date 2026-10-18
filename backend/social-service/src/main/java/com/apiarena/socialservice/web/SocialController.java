package com.apiarena.socialservice.web;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.socialservice.service.SocialFeedService;
import com.apiarena.socialservice.service.SocialModerationService;
import com.apiarena.socialservice.service.SocialPostService;
import com.apiarena.socialservice.service.SocialPrivacyService;
import com.apiarena.socialservice.service.SocialReactionService;

@RestController
@RequestMapping("/api/social")
public class SocialController {

    private final boolean enabled;
    private final SocialFeedService feedService;
    private final SocialPostService postService;
    private final SocialReactionService reactionService;
    private final SocialPrivacyService privacyService;
    private final SocialModerationService moderationService;

    public SocialController(
            @Value("${app.social.enabled:false}") boolean enabled,
            SocialFeedService feedService,
            SocialPostService postService,
            SocialReactionService reactionService,
            SocialPrivacyService privacyService,
            SocialModerationService moderationService) {
        this.enabled = enabled;
        this.feedService = feedService;
        this.postService = postService;
        this.reactionService = reactionService;
        this.privacyService = privacyService;
        this.moderationService = moderationService;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of("enabled", enabled);
    }

    @GetMapping("/feed")
    public Map<String, Object> feed(
            Authentication authentication,
            @RequestParam(defaultValue = "all") String tab,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int limit) {
        if (!enabled) {
            return Map.of("enabled", false, "items", java.util.List.of(), "nextCursor", "");
        }
        Map<String, Object> page = feedService.page(userId(authentication), tab, cursor, limit);
        page.put("enabled", true);
        return page;
    }

    @PostMapping("/posts")
    public Map<String, Object> publish(Authentication authentication, @RequestBody Map<String, Object> body) {
        long submissionId = longVal(body.get("submissionId"));
        String caption = body.get("caption") == null ? null : String.valueOf(body.get("caption"));
        return postService.publish(userId(authentication), submissionId, caption);
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deletePost(Authentication authentication, @PathVariable long id) {
        postService.deleteOwn(userId(authentication), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reactions")
    public Map<String, Object> react(Authentication authentication, @RequestBody Map<String, Object> body) {
        return reactionService.toggle(
                userId(authentication),
                body.get("targetType") == null ? null : String.valueOf(body.get("targetType")),
                longVal(body.get("targetId")),
                body.get("reaction") == null ? null : String.valueOf(body.get("reaction")));
    }

    @PostMapping("/reports")
    public Map<String, Object> report(Authentication authentication, @RequestBody Map<String, Object> body) {
        return moderationService.report(
                userId(authentication),
                body.get("targetType") == null ? null : String.valueOf(body.get("targetType")),
                longVal(body.get("targetId")),
                body.get("reason") == null ? null : String.valueOf(body.get("reason")));
    }

    @GetMapping("/me/privacy")
    public Map<String, Object> privacy(Authentication authentication) {
        return privacyService.get(userId(authentication));
    }

    @PutMapping("/me/privacy")
    public Map<String, Object> updatePrivacy(Authentication authentication, @RequestBody Map<String, Object> body) {
        Boolean alerts = body.get("friendPostNotifications") instanceof Boolean b ? b : null;
        String visibility = body.get("activityVisibility") == null ? null : String.valueOf(body.get("activityVisibility"));
        return privacyService.update(userId(authentication), visibility, alerts);
    }

    @GetMapping("/admin/reports")
    @PreAuthorize("hasRole('ADMIN') and hasAuthority('CAP_MODERATION')")
    public Object adminReports() {
        return moderationService.reports();
    }

    @PostMapping("/admin/hide")
    @PreAuthorize("hasRole('ADMIN') and hasAuthority('CAP_MODERATION')")
    public ResponseEntity<Void> hide(@RequestBody Map<String, Object> body) {
        moderationService.hide(
                body.get("targetType") == null ? null : String.valueOf(body.get("targetType")),
                longVal(body.get("targetId")));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/admin/posts/{id}")
    @PreAuthorize("hasRole('ADMIN') and hasAuthority('CAP_MODERATION')")
    public ResponseEntity<Void> adminDelete(@PathVariable long id) {
        moderationService.deletePost(id);
        return ResponseEntity.noContent().build();
    }

    private static long userId(Authentication authentication) {
        if (authentication != null && authentication.getDetails() instanceof Map<?, ?> map) {
            Object id = map.get("userId");
            if (id instanceof Number n) {
                return n.longValue();
            }
            if (id instanceof String s) {
                return Long.parseLong(s);
            }
        }
        throw new IllegalArgumentException("User ID not found in token");
    }

    private static long longVal(Object value) {
        if (value instanceof Number n) {
            return n.longValue();
        }
        if (value instanceof String s && !s.isBlank()) {
            return Long.parseLong(s.trim());
        }
        throw new IllegalArgumentException("Missing id");
    }
}
