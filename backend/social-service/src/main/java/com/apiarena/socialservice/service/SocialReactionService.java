package com.apiarena.socialservice.service;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.apiarena.socialservice.domain.FeedVisibility;
import com.apiarena.socialservice.domain.ReactionPolicy;
import com.apiarena.socialservice.domain.Reactions;
import com.apiarena.socialservice.model.entity.SocialReaction;
import com.apiarena.socialservice.repository.SocialActivityRepository;
import com.apiarena.socialservice.repository.SocialPostRepository;
import com.apiarena.socialservice.repository.SocialPrivacyRepository;
import com.apiarena.socialservice.repository.SocialReactionRepository;

@Service
public class SocialReactionService {

    private final SocialReactionRepository reactionRepository;
    private final SocialActivityRepository activityRepository;
    private final SocialPostRepository postRepository;
    private final SocialPrivacyRepository privacyRepository;
    private final FriendDirectory friendDirectory;

    public SocialReactionService(
            SocialReactionRepository reactionRepository,
            SocialActivityRepository activityRepository,
            SocialPostRepository postRepository,
            SocialPrivacyRepository privacyRepository,
            FriendDirectory friendDirectory) {
        this.reactionRepository = reactionRepository;
        this.activityRepository = activityRepository;
        this.postRepository = postRepository;
        this.privacyRepository = privacyRepository;
        this.friendDirectory = friendDirectory;
    }

    @Transactional
    public Map<String, Object> toggle(long userId, String targetTypeRaw, long targetId, String reactionRaw) {
        String targetType = Reactions.targetType(targetTypeRaw);
        if (targetType == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown target");
        }
        long authorId = authorOf(targetType, targetId);
        boolean friends = userId == authorId || friendDirectory.friendIds(userId).contains(authorId);
        if (Reactions.ACTIVITY.equals(targetType)) {
            String visibility = privacyRepository.findById(authorId)
                    .map(s -> s.getActivityVisibility()).orElse(FeedVisibility.FRIENDS);
            if (!FeedVisibility.canSeeActivity(userId, authorId, friends, visibility)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
            }
        } else if (!FeedVisibility.canSeePost(userId, authorId, friends)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
        }
        ReactionPolicy.Decision decision;
        try {
            String existing = reactionRepository.findByTargetTypeAndTargetIdAndUserId(targetType, targetId, userId)
                    .map(SocialReaction::getReaction)
                    .orElse(null);
            decision = ReactionPolicy.toggle(existing, reactionRaw);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown reaction");
        }
        if (decision.action() == ReactionPolicy.Action.DELETE) {
            reactionRepository.findByTargetTypeAndTargetIdAndUserId(targetType, targetId, userId)
                    .ifPresent(reactionRepository::delete);
        } else if (decision.action() == ReactionPolicy.Action.INSERT) {
            SocialReaction row = new SocialReaction();
            row.setTargetType(targetType);
            row.setTargetId(targetId);
            row.setUserId(userId);
            row.setReaction(decision.reaction());
            reactionRepository.save(row);
        } else {
            SocialReaction row = reactionRepository.findByTargetTypeAndTargetIdAndUserId(targetType, targetId, userId)
                    .orElseThrow();
            row.setReaction(decision.reaction());
            reactionRepository.save(row);
        }
        return Map.of("targetType", targetType, "targetId", targetId, "reaction",
                decision.action() == ReactionPolicy.Action.DELETE ? "" : decision.reaction());
    }

    private long authorOf(String targetType, long targetId) {
        if (Reactions.ACTIVITY.equals(targetType)) {
            return activityRepository.findById(targetId)
                    .filter(a -> !a.isHidden())
                    .map(a -> a.getUserId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        }
        return postRepository.findById(targetId)
                .filter(p -> !p.isHidden())
                .map(p -> p.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
    }

}
