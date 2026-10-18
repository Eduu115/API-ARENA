package com.apiarena.socialservice.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.apiarena.socialservice.domain.Reactions;
import com.apiarena.socialservice.model.entity.SocialActivityEntry;
import com.apiarena.socialservice.model.entity.SocialPost;
import com.apiarena.socialservice.model.entity.SocialReport;
import com.apiarena.socialservice.repository.SocialActivityRepository;
import com.apiarena.socialservice.repository.SocialPostRepository;
import com.apiarena.socialservice.repository.SocialReportRepository;

@Service
public class SocialModerationService {

    private final SocialReportRepository reportRepository;
    private final SocialPostRepository postRepository;
    private final SocialActivityRepository activityRepository;
    private final SocialPostService postService;

    public SocialModerationService(
            SocialReportRepository reportRepository,
            SocialPostRepository postRepository,
            SocialActivityRepository activityRepository,
            SocialPostService postService) {
        this.reportRepository = reportRepository;
        this.postRepository = postRepository;
        this.activityRepository = activityRepository;
        this.postService = postService;
    }

    @Transactional
    public Map<String, Object> report(long reporterId, String targetTypeRaw, long targetId, String reason) {
        String targetType = Reactions.targetType(targetTypeRaw);
        if (targetType == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown target");
        }
        if (Reactions.POST.equals(targetType)) {
            if (postRepository.findById(targetId).isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
            }
        } else if (activityRepository.findById(targetId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
        }
        String note = reason == null ? null : reason.trim();
        if (note != null && note.length() > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reason is too long");
        }
        SocialReport row = reportRepository.findByTargetTypeAndTargetIdAndReporterUserId(targetType, targetId, reporterId)
                .orElseGet(SocialReport::new);
        row.setTargetType(targetType);
        row.setTargetId(targetId);
        row.setReporterUserId(reporterId);
        row.setReason(note == null || note.isEmpty() ? null : note);
        SocialReport saved = reportRepository.save(row);
        return Map.of("id", saved.getId() == null ? 0 : saved.getId());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> reports() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (SocialReport report : reportRepository.findTop100ByOrderByCreatedAtDesc()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", report.getId());
            row.put("targetType", report.getTargetType());
            row.put("targetId", report.getTargetId());
            row.put("reporterUserId", report.getReporterUserId());
            row.put("reason", report.getReason());
            row.put("createdAt", report.getCreatedAt() == null ? null : report.getCreatedAt().toString());
            out.add(row);
        }
        return out;
    }

    @Transactional
    public void hide(String targetTypeRaw, long targetId) {
        String targetType = Reactions.targetType(targetTypeRaw);
        if (Reactions.POST.equals(targetType)) {
            SocialPost post = postRepository.findById(targetId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
            post.setHidden(true);
            postRepository.save(post);
            return;
        }
        if (Reactions.ACTIVITY.equals(targetType)) {
            SocialActivityEntry entry = activityRepository.findById(targetId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
            entry.setHidden(true);
            activityRepository.save(entry);
            return;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown target");
    }

    @Transactional
    public void deletePost(long postId) {
        SocialPost post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        postService.removePost(post);
    }
}
