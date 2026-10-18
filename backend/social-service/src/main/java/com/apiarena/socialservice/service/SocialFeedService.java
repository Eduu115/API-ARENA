package com.apiarena.socialservice.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.socialservice.domain.FeedCursor;
import com.apiarena.socialservice.domain.FeedVisibility;
import com.apiarena.socialservice.domain.Reactions;
import com.apiarena.socialservice.model.entity.SocialActivityEntry;
import com.apiarena.socialservice.model.entity.SocialPost;
import com.apiarena.socialservice.model.entity.SocialPostScore;
import com.apiarena.socialservice.model.entity.SocialPostTestResult;
import com.apiarena.socialservice.model.entity.SocialPrivacySetting;
import com.apiarena.socialservice.model.entity.SocialReaction;
import com.apiarena.socialservice.repository.SocialActivityRepository;
import com.apiarena.socialservice.repository.SocialPostRepository;
import com.apiarena.socialservice.repository.SocialPostScoreRepository;
import com.apiarena.socialservice.repository.SocialPostTestRepository;
import com.apiarena.socialservice.repository.SocialPrivacyRepository;
import com.apiarena.socialservice.repository.SocialReactionRepository;

@Service
public class SocialFeedService {

    private final SocialActivityRepository activityRepository;
    private final SocialPostRepository postRepository;
    private final SocialPostTestRepository testRepository;
    private final SocialPostScoreRepository scoreRepository;
    private final SocialPrivacyRepository privacyRepository;
    private final SocialReactionRepository reactionRepository;
    private final FriendDirectory friendDirectory;

    public SocialFeedService(
            SocialActivityRepository activityRepository,
            SocialPostRepository postRepository,
            SocialPostTestRepository testRepository,
            SocialPostScoreRepository scoreRepository,
            SocialPrivacyRepository privacyRepository,
            SocialReactionRepository reactionRepository,
            FriendDirectory friendDirectory) {
        this.activityRepository = activityRepository;
        this.postRepository = postRepository;
        this.testRepository = testRepository;
        this.scoreRepository = scoreRepository;
        this.privacyRepository = privacyRepository;
        this.reactionRepository = reactionRepository;
        this.friendDirectory = friendDirectory;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> page(long viewerId, String tab, String cursor, int requested) {
        int size = Math.min(Math.max(requested, 1), 30);
        String mode = tab == null ? "all" : tab.trim().toLowerCase();
        boolean wantActivity = mode.equals("all") || mode.equals("activity");
        boolean wantPosts = mode.equals("all") || mode.equals("posts");

        List<Long> friendIds = friendDirectory.friendIds(viewerId);
        Set<Long> friends = new HashSet<>(friendIds);
        Set<Long> audience = new LinkedHashSet<>();
        audience.add(viewerId);
        audience.addAll(friendIds);

        FeedCursor.Point point = FeedCursor.decode(cursor);
        Instant cursorAt = point == null ? Instant.now().plusSeconds(5) : point.at();
        Map<Long, String> visibility = visibilityOf(audience);

        List<Row> rows = new ArrayList<>();
        if (wantActivity && !audience.isEmpty()) {
            for (SocialActivityEntry entry : activityRepository.page(audience, cursorAt, PageRequest.of(0, size * 2))) {
                if (!FeedVisibility.canSeeActivity(viewerId, entry.getUserId(), friends.contains(entry.getUserId()),
                        visibility.get(entry.getUserId()))) {
                    continue;
                }
                if (!FeedCursor.afterCursor(point, entry.getCreatedAt(), entry.getId())) {
                    continue;
                }
                rows.add(new Row("ACTIVITY", entry.getId(), entry.getCreatedAt(), entry, null));
            }
        }
        if (wantPosts && !audience.isEmpty()) {
            for (SocialPost post : postRepository.page(audience, cursorAt, PageRequest.of(0, size * 2))) {
                if (!FeedVisibility.canSeePost(viewerId, post.getUserId(), friends.contains(post.getUserId()))) {
                    continue;
                }
                if (!FeedCursor.afterCursor(point, post.getCreatedAt(), post.getId())) {
                    continue;
                }
                rows.add(new Row("POST", post.getId(), post.getCreatedAt(), null, post));
            }
        }
        rows.sort(Comparator
                .comparing((Row r) -> r.createdAt == null ? Instant.EPOCH : r.createdAt).reversed()
                .thenComparing(Comparator.comparingLong((Row r) -> r.id).reversed()));
        boolean more = rows.size() > size;
        if (more) {
            rows = new ArrayList<>(rows.subList(0, size));
        }

        List<Long> activityIds = rows.stream().filter(r -> r.activity != null).map(r -> r.id).toList();
        List<Long> postIds = rows.stream().filter(r -> r.post != null).map(r -> r.id).toList();
        Map<Long, List<SocialPostTestResult>> tests = groupTests(postIds);
        Map<Long, List<SocialPostScore>> scores = groupScores(postIds);
        Map<Long, Map<String, Long>> activityCounts = counts(Reactions.ACTIVITY, activityIds);
        Map<Long, Map<String, Long>> postCounts = counts(Reactions.POST, postIds);
        Map<Long, String> myActivity = mine(viewerId, Reactions.ACTIVITY, activityIds);
        Map<Long, String> myPost = mine(viewerId, Reactions.POST, postIds);

        Set<Long> authors = new HashSet<>();
        rows.forEach(r -> authors.add(r.authorId()));
        Map<Long, String> names = friendDirectory.usernames(authors);

        List<Map<String, Object>> items = new ArrayList<>();
        for (Row row : rows) {
            items.add(toItem(viewerId, row, names, tests, scores, activityCounts, postCounts, myActivity, myPost));
        }
        String next = null;
        if (more && !rows.isEmpty()) {
            Row last = rows.get(rows.size() - 1);
            next = FeedCursor.encode(last.createdAt, last.id, last.kind);
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("items", items);
        body.put("nextCursor", next);
        return body;
    }

    private Map<Long, String> visibilityOf(Set<Long> audience) {
        Map<Long, String> out = new HashMap<>();
        if (audience.isEmpty()) {
            return out;
        }
        for (SocialPrivacySetting setting : privacyRepository.findByUserIdIn(audience)) {
            out.put(setting.getUserId(), setting.getActivityVisibility());
        }
        return out;
    }

    private Map<Long, List<SocialPostTestResult>> groupTests(List<Long> postIds) {
        Map<Long, List<SocialPostTestResult>> out = new HashMap<>();
        if (postIds.isEmpty()) {
            return out;
        }
        for (SocialPostTestResult row : testRepository.findByPostIdIn(postIds)) {
            out.computeIfAbsent(row.getPostId(), k -> new ArrayList<>()).add(row);
        }
        return out;
    }

    private Map<Long, List<SocialPostScore>> groupScores(List<Long> postIds) {
        Map<Long, List<SocialPostScore>> out = new HashMap<>();
        if (postIds.isEmpty()) {
            return out;
        }
        for (SocialPostScore row : scoreRepository.findByPostIdIn(postIds)) {
            out.computeIfAbsent(row.getPostId(), k -> new ArrayList<>()).add(row);
        }
        return out;
    }

    private Map<Long, Map<String, Long>> counts(String type, List<Long> ids) {
        Map<Long, Map<String, Long>> out = new HashMap<>();
        if (ids.isEmpty()) {
            return out;
        }
        for (Object[] row : reactionRepository.counts(type, ids)) {
            Long targetId = ((Number) row[0]).longValue();
            String reaction = String.valueOf(row[1]);
            long count = ((Number) row[2]).longValue();
            out.computeIfAbsent(targetId, k -> new LinkedHashMap<>()).put(reaction, count);
        }
        return out;
    }

    private Map<Long, String> mine(long viewerId, String type, List<Long> ids) {
        Map<Long, String> out = new HashMap<>();
        if (ids.isEmpty()) {
            return out;
        }
        for (SocialReaction reaction : reactionRepository.findByTargetTypeAndTargetIdInAndUserId(type, ids, viewerId)) {
            out.put(reaction.getTargetId(), reaction.getReaction());
        }
        return out;
    }

    private Map<String, Object> toItem(
            long viewerId,
            Row row,
            Map<Long, String> names,
            Map<Long, List<SocialPostTestResult>> tests,
            Map<Long, List<SocialPostScore>> scores,
            Map<Long, Map<String, Long>> activityCounts,
            Map<Long, Map<String, Long>> postCounts,
            Map<Long, String> myActivity,
            Map<Long, String> myPost) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("kind", row.kind);
        item.put("id", row.id);
        item.put("userId", row.authorId());
        item.put("username", names.get(row.authorId()));
        item.put("createdAt", row.createdAt == null ? null : row.createdAt.toString());
        item.put("mine", row.authorId() == viewerId);
        if (row.activity != null) {
            SocialActivityEntry a = row.activity;
            item.put("activityType", a.getActivityType());
            item.put("challengeId", a.getChallengeId());
            item.put("challengeTitle", a.getChallengeTitle());
            item.put("score", a.getScore());
            item.put("previousValue", a.getPreviousValue());
            item.put("newValue", a.getNewValue());
            item.put("delta", a.getDelta());
            item.put("labelBefore", a.getLabelBefore());
            item.put("labelAfter", a.getLabelAfter());
            item.put("achievementCode", a.getAchievementCode());
            item.put("achievementTitle", a.getAchievementTitle());
            item.put("streakWeeks", a.getStreakWeeks());
            item.put("reactions", activityCounts.getOrDefault(a.getId(), Map.of()));
            item.put("myReaction", myActivity.get(a.getId()));
        } else {
            SocialPost p = row.post;
            item.put("activityType", "POST");
            item.put("submissionId", p.getSubmissionId());
            item.put("challengeId", p.getChallengeId());
            item.put("challengeTitle", p.getChallengeTitle());
            item.put("caption", p.getCaption());
            item.put("totalScore", p.getTotalScore());
            item.put("technicalScore", p.getTechnicalScore());
            item.put("aiScore", p.getAiScore());
            item.put("testsPassed", p.getTestsPassed());
            item.put("testsFailed", p.getTestsFailed());
            item.put("avgResponseMs", p.getAvgResponseMs());
            item.put("p95ResponseMs", p.getP95ResponseMs());
            item.put("p99ResponseMs", p.getP99ResponseMs());
            item.put("rps", p.getRps());
            item.put("tests", tests.getOrDefault(p.getId(), List.of()).stream().map(t -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("name", t.getTestName());
                m.put("passed", t.isPassed());
                return m;
            }).toList());
            item.put("scores", scores.getOrDefault(p.getId(), List.of()).stream().map(s -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("key", s.getScoreKey());
                m.put("value", s.getScoreValue());
                m.put("max", s.getMaxValue());
                return m;
            }).toList());
            item.put("reactions", postCounts.getOrDefault(p.getId(), Map.of()));
            item.put("myReaction", myPost.get(p.getId()));
        }
        return item;
    }

    private record Row(String kind, long id, Instant createdAt, SocialActivityEntry activity, SocialPost post) {
        long authorId() {
            return activity != null ? activity.getUserId() : post.getUserId();
        }
    }
}
