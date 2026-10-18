package com.apiarena.socialservice.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.socialservice.domain.Reactions;
import com.apiarena.socialservice.model.entity.SocialActivityEntry;
import com.apiarena.socialservice.model.entity.SocialPost;
import com.apiarena.socialservice.model.entity.SocialPostScore;
import com.apiarena.socialservice.model.entity.SocialPostTestResult;
import com.apiarena.socialservice.model.entity.SocialReaction;
import com.apiarena.socialservice.model.entity.SocialReport;
import com.apiarena.socialservice.repository.SocialActivityRepository;
import com.apiarena.socialservice.repository.SocialPostRepository;
import com.apiarena.socialservice.repository.SocialPostScoreRepository;
import com.apiarena.socialservice.repository.SocialPostTestRepository;
import com.apiarena.socialservice.repository.SocialPrivacyRepository;
import com.apiarena.socialservice.repository.SocialReactionRepository;
import com.apiarena.socialservice.repository.SocialReportRepository;

@Service
public class SocialGdprService {

    private final SocialActivityRepository activityRepository;
    private final SocialPostRepository postRepository;
    private final SocialPostTestRepository testRepository;
    private final SocialPostScoreRepository scoreRepository;
    private final SocialReactionRepository reactionRepository;
    private final SocialReportRepository reportRepository;
    private final SocialPrivacyRepository privacyRepository;

    public SocialGdprService(
            SocialActivityRepository activityRepository,
            SocialPostRepository postRepository,
            SocialPostTestRepository testRepository,
            SocialPostScoreRepository scoreRepository,
            SocialReactionRepository reactionRepository,
            SocialReportRepository reportRepository,
            SocialPrivacyRepository privacyRepository) {
        this.activityRepository = activityRepository;
        this.postRepository = postRepository;
        this.testRepository = testRepository;
        this.scoreRepository = scoreRepository;
        this.reactionRepository = reactionRepository;
        this.reportRepository = reportRepository;
        this.privacyRepository = privacyRepository;
    }

    @Transactional
    public Map<String, Object> purge(Long userId) {
        if (userId == null) {
            return Map.of("userId", 0, "removed", false);
        }
        List<Long> postIds = postRepository.findIdsByUserId(userId);
        List<Long> activityIds = activityRepository.findIdsByUserId(userId);
        reactionRepository.deleteByUserId(userId);
        reportRepository.deleteByReporterUserId(userId);
        if (!postIds.isEmpty()) {
            reactionRepository.deleteByTargetTypeAndTargetIdIn(Reactions.POST, postIds);
            reportRepository.deleteByTargetTypeAndTargetIdIn(Reactions.POST, postIds);
            for (Long postId : postIds) {
                testRepository.deleteByPostId(postId);
                scoreRepository.deleteByPostId(postId);
            }
        }
        if (!activityIds.isEmpty()) {
            reactionRepository.deleteByTargetTypeAndTargetIdIn(Reactions.ACTIVITY, activityIds);
            reportRepository.deleteByTargetTypeAndTargetIdIn(Reactions.ACTIVITY, activityIds);
        }
        postRepository.deleteByUserId(userId);
        activityRepository.deleteByUserId(userId);
        privacyRepository.deleteById(userId);
        return Map.of("userId", userId, "postsRemoved", postIds.size(), "activitiesRemoved", activityIds.size());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> export(Long userId) {
        Map<String, Object> root = new LinkedHashMap<>();
        privacyRepository.findById(userId).ifPresentOrElse(row -> {
            root.put("activityVisibility", row.getActivityVisibility());
            root.put("friendPostNotifications", row.isFriendPostNotifications());
        }, () -> {
            root.put("activityVisibility", "FRIENDS");
            root.put("friendPostNotifications", true);
        });
        List<Map<String, Object>> activities = new ArrayList<>();
        for (SocialActivityEntry entry : activityRepository.findByUserIdOrderByCreatedAtDesc(userId)) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", entry.getId());
            row.put("activityType", entry.getActivityType());
            row.put("challengeId", entry.getChallengeId());
            row.put("challengeTitle", entry.getChallengeTitle());
            row.put("score", entry.getScore());
            row.put("previousValue", entry.getPreviousValue());
            row.put("newValue", entry.getNewValue());
            row.put("delta", entry.getDelta());
            row.put("achievementCode", entry.getAchievementCode());
            row.put("achievementTitle", entry.getAchievementTitle());
            row.put("streakWeeks", entry.getStreakWeeks());
            row.put("createdAt", entry.getCreatedAt() == null ? null : entry.getCreatedAt().toString());
            activities.add(row);
        }
        root.put("activities", activities);
        List<Map<String, Object>> posts = new ArrayList<>();
        for (SocialPost post : postRepository.findByUserIdOrderByCreatedAtDesc(userId)) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", post.getId());
            row.put("submissionId", post.getSubmissionId());
            row.put("challengeId", post.getChallengeId());
            row.put("challengeTitle", post.getChallengeTitle());
            row.put("caption", post.getCaption());
            row.put("totalScore", post.getTotalScore());
            row.put("technicalScore", post.getTechnicalScore());
            row.put("aiScore", post.getAiScore());
            row.put("tests", testRepository.findByPostId(post.getId()).stream().map(this::testRow).toList());
            row.put("scores", scoreRepository.findByPostId(post.getId()).stream().map(this::scoreRow).toList());
            row.put("createdAt", post.getCreatedAt() == null ? null : post.getCreatedAt().toString());
            posts.add(row);
        }
        root.put("posts", posts);
        List<Map<String, Object>> reactions = new ArrayList<>();
        for (SocialReaction reaction : reactionRepository.findByUserId(userId)) {
            reactions.add(Map.of(
                    "targetType", reaction.getTargetType(),
                    "targetId", reaction.getTargetId(),
                    "reaction", reaction.getReaction()));
        }
        root.put("reactions", reactions);
        List<Map<String, Object>> reports = new ArrayList<>();
        for (SocialReport report : reportRepository.findByReporterUserId(userId)) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("targetType", report.getTargetType());
            row.put("targetId", report.getTargetId());
            row.put("reason", report.getReason());
            reports.add(row);
        }
        root.put("reports", reports);
        return root;
    }

    private Map<String, Object> testRow(SocialPostTestResult test) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("name", test.getTestName());
        row.put("passed", test.isPassed());
        return row;
    }

    private Map<String, Object> scoreRow(SocialPostScore score) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("key", score.getScoreKey());
        row.put("value", score.getScoreValue());
        row.put("max", score.getMaxValue());
        return row;
    }
}
