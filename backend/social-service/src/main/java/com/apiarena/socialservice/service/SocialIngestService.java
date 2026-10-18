package com.apiarena.socialservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.socialservice.domain.SubmissionActivityPlanner;
import com.apiarena.socialservice.kafka.SubmissionCompletedEvent;
import com.apiarena.socialservice.kafka.UserActivityEvent;
import com.apiarena.socialservice.model.entity.SocialActivityEntry;
import com.apiarena.socialservice.repository.SocialActivityRepository;

@Service
public class SocialIngestService {

    private static final Logger log = LoggerFactory.getLogger(SocialIngestService.class);

    private final SocialActivityRepository activityRepository;

    public SocialIngestService(SocialActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    @Transactional
    public void fromSubmission(SubmissionCompletedEvent event) {
        if (event.submissionId() == null || event.userId() == null) {
            return;
        }
        String completedSource = "submission:" + event.submissionId() + ":completed";
        boolean prior = event.challengeId() != null && activityRepository.existsOther(
                event.userId(), event.challengeId(), SubmissionActivityPlanner.COMPLETED, completedSource);
        Integer previousBest = event.challengeId() == null ? null : activityRepository.maxScoreExcluding(
                event.userId(), event.challengeId(), SubmissionActivityPlanner.COMPLETED, completedSource);
        for (SubmissionActivityPlanner.Planned planned : SubmissionActivityPlanner.plan(
                event.submissionId(), event.score(), prior, previousBest)) {
            SocialActivityEntry row = new SocialActivityEntry();
            row.setUserId(event.userId());
            row.setActivityType(planned.activityType());
            row.setSourceEventId(planned.sourceEventId());
            row.setChallengeId(event.challengeId());
            row.setChallengeTitle(clip(event.challengeTitle(), 200));
            row.setScore(planned.score());
            row.setPreviousValue(planned.previousScore());
            row.setNewValue(planned.score());
            if (planned.previousScore() != null && planned.score() != null) {
                row.setDelta(planned.score() - planned.previousScore());
            }
            accept(row);
        }
    }

    @Transactional
    public void fromUserActivity(UserActivityEvent event) {
        if (event.userId() == null || event.sourceEventId() == null || event.sourceEventId().isBlank()
                || event.activityType() == null || event.activityType().isBlank()) {
            return;
        }
        SocialActivityEntry row = new SocialActivityEntry();
        row.setUserId(event.userId());
        row.setActivityType(event.activityType().trim());
        row.setSourceEventId(event.sourceEventId().trim());
        row.setChallengeId(event.challengeId());
        row.setChallengeTitle(clip(event.challengeTitle(), 200));
        row.setScore(event.score());
        row.setPreviousValue(event.previousValue());
        row.setNewValue(event.newValue());
        row.setDelta(event.delta());
        row.setLabelBefore(clip(event.labelBefore(), 40));
        row.setLabelAfter(clip(event.labelAfter(), 40));
        row.setAchievementCode(clip(event.achievementCode(), 80));
        row.setAchievementTitle(clip(event.achievementTitle(), 200));
        row.setStreakWeeks(event.streakWeeks());
        accept(row);
    }

    /** @return true when this source event was stored for the first time */
    public boolean accept(SocialActivityEntry row) {
        if (row.getSourceEventId() == null || activityRepository.existsBySourceEventId(row.getSourceEventId())) {
            return false;
        }
        try {
            activityRepository.save(row);
            return true;
        } catch (DataIntegrityViolationException e) {
            log.debug("Duplicate activity source {}: {}", row.getSourceEventId(), e.getMessage());
            return false;
        }
    }

    private static String clip(String value, int max) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        if (t.isEmpty()) {
            return null;
        }
        return t.length() <= max ? t : t.substring(0, max);
    }
}
