package com.apiarena.socialservice.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.apiarena.socialservice.domain.Reactions;
import com.apiarena.socialservice.model.entity.SocialPost;
import com.apiarena.socialservice.model.entity.SocialPostScore;
import com.apiarena.socialservice.model.entity.SocialPostTestResult;
import com.apiarena.socialservice.model.entity.SocialPrivacySetting;
import com.apiarena.socialservice.repository.SocialPostRepository;
import com.apiarena.socialservice.repository.SocialPostScoreRepository;
import com.apiarena.socialservice.repository.SocialPostTestRepository;
import com.apiarena.socialservice.repository.SocialPrivacyRepository;
import com.apiarena.socialservice.repository.SocialReactionRepository;
import com.apiarena.socialservice.repository.SocialReportRepository;

@Service
public class SocialPostService {

    private final boolean enabled;
    private final SubmissionSnapshotClient snapshots;
    private final SocialPostRepository postRepository;
    private final SocialPostTestRepository testRepository;
    private final SocialPostScoreRepository scoreRepository;
    private final SocialReactionRepository reactionRepository;
    private final SocialReportRepository reportRepository;
    private final SocialPrivacyRepository privacyRepository;
    private final FriendDirectory friendDirectory;
    private final FriendPostNotifier notifier;

    public SocialPostService(
            @Value("${app.social.enabled:false}") boolean enabled,
            SubmissionSnapshotClient snapshots,
            SocialPostRepository postRepository,
            SocialPostTestRepository testRepository,
            SocialPostScoreRepository scoreRepository,
            SocialReactionRepository reactionRepository,
            SocialReportRepository reportRepository,
            SocialPrivacyRepository privacyRepository,
            FriendDirectory friendDirectory,
            FriendPostNotifier notifier) {
        this.enabled = enabled;
        this.snapshots = snapshots;
        this.postRepository = postRepository;
        this.testRepository = testRepository;
        this.scoreRepository = scoreRepository;
        this.reactionRepository = reactionRepository;
        this.reportRepository = reportRepository;
        this.privacyRepository = privacyRepository;
        this.friendDirectory = friendDirectory;
        this.notifier = notifier;
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> publish(long userId, long submissionId, String caption) {
        if (!enabled) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SOCIAL_DISABLED");
        }
        String note = caption == null ? null : caption.trim();
        if (note != null && note.length() > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Caption is too long");
        }
        if (note != null && note.isEmpty()) {
            note = null;
        }
        if (postRepository.findBySubmissionId(submissionId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already published");
        }
        Map<String, Object> snap = snapshots.load(submissionId);
        Long owner = snap.get("userId") instanceof Number n ? n.longValue() : null;
        if (owner == null || owner != userId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your submission");
        }
        String status = snap.get("status") == null ? "" : String.valueOf(snap.get("status"));
        if (!"COMPLETED".equalsIgnoreCase(status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Submission is not completed");
        }
        Integer total = snap.get("totalScore") instanceof Number n ? n.intValue() : 0;
        SocialPost post = new SocialPost();
        post.setUserId(userId);
        post.setSubmissionId(submissionId);
        post.setChallengeId(snap.get("challengeId") instanceof Number n ? n.longValue() : null);
        post.setChallengeTitle(snap.get("challengeTitle") == null ? null : String.valueOf(snap.get("challengeTitle")));
        post.setCaption(note);
        post.setTotalScore(total);
        post.setTechnicalScore(snap.get("technicalScore") instanceof Number n ? n.intValue() : 0);
        post.setAiScore(snap.get("aiScore") instanceof Number n ? n.intValue() : 0);
        post.setTestsPassed(snap.get("testsPassed") instanceof Number n ? n.intValue() : 0);
        post.setTestsFailed(snap.get("testsFailed") instanceof Number n ? n.intValue() : 0);
        post.setAvgResponseMs(asInt(snap.get("avgResponseMs")));
        post.setP95ResponseMs(asInt(snap.get("p95ResponseMs")));
        post.setP99ResponseMs(asInt(snap.get("p99ResponseMs")));
        post.setRps(asInt(snap.get("rps")));
        SocialPost saved = postRepository.save(post);

        Object tests = snap.get("tests");
        if (tests instanceof List<?> list) {
            for (Object item : list) {
                if (!(item instanceof Map<?, ?> map) || map.get("name") == null) {
                    continue;
                }
                SocialPostTestResult row = new SocialPostTestResult();
                row.setPostId(saved.getId());
                row.setTestName(String.valueOf(map.get("name")));
                row.setPassed(Boolean.TRUE.equals(map.get("passed")));
                testRepository.save(row);
            }
        }
        Object scores = snap.get("scores");
        if (scores instanceof List<?> list) {
            for (Object item : list) {
                if (!(item instanceof Map<?, ?> map) || map.get("key") == null || !(map.get("value") instanceof Number value)) {
                    continue;
                }
                SocialPostScore row = new SocialPostScore();
                row.setPostId(saved.getId());
                row.setScoreKey(String.valueOf(map.get("key")));
                row.setScoreValue(value.intValue());
                row.setMaxValue(asInt(map.get("max")));
                scoreRepository.save(row);
            }
        }
        notifyFriends(saved);
        return Map.of("id", saved.getId(), "submissionId", saved.getSubmissionId());
    }

    @Transactional
    public void deleteOwn(long userId, long postId) {
        SocialPost post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        if (post.getUserId() != userId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your post");
        }
        removePost(post);
    }

    @Transactional
    public void removePost(SocialPost post) {
        testRepository.deleteByPostId(post.getId());
        scoreRepository.deleteByPostId(post.getId());
        reactionRepository.deleteByTargetTypeAndTargetId(Reactions.POST, post.getId());
        reportRepository.deleteByTargetTypeAndTargetId(Reactions.POST, post.getId());
        postRepository.delete(post);
    }

    private void notifyFriends(SocialPost post) {
        String username = friendDirectory.usernames(List.of(post.getUserId())).get(post.getUserId());
        for (Long friendId : friendDirectory.friendIds(post.getUserId())) {
            SocialPrivacySetting setting = privacyRepository.findById(friendId).orElse(null);
            if (setting != null && !setting.isFriendPostNotifications()) {
                continue;
            }
            notifier.notifyFriend(friendId, post.getUserId(), username, post.getId(), post.getChallengeTitle());
        }
    }

    private static Integer asInt(Object value) {
        return value instanceof Number n ? n.intValue() : null;
    }
}
