package com.apiarena.notificationservice.model.services;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.notificationservice.kafka.SubmissionCompletedEvent;
import com.apiarena.notificationservice.model.dto.NotificationDTO;
import com.apiarena.notificationservice.model.entities.Notification;
import com.apiarena.notificationservice.model.entities.NotificationImportance;
import com.apiarena.notificationservice.repository.NotificationRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class NotificationService {

    public static final String TYPE_SUBMISSION_COMPLETED = "SUBMISSION_COMPLETED";

    public static final String TYPE_WELCOME = "WELCOME";

    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;
    private final NotificationPushService notificationPushService;
    private final NotificationEmailDispatchService notificationEmailDispatchService;

    public NotificationService(
            NotificationRepository notificationRepository,
            ObjectMapper objectMapper,
            NotificationPushService notificationPushService,
            NotificationEmailDispatchService notificationEmailDispatchService
    ) {
        this.notificationRepository = notificationRepository;
        this.objectMapper = objectMapper;
        this.notificationPushService = notificationPushService;
        this.notificationEmailDispatchService = notificationEmailDispatchService;
    }

    @Transactional
    public void createFromSubmissionCompleted(SubmissionCompletedEvent event) {
        if (notificationRepository.existsByUserIdAndSourceSubmissionId(event.userId(), event.submissionId())) {
            return;
        }
        Map<String, Object> meta = new HashMap<>();
        meta.put("submissionId", event.submissionId());
        meta.put("challengeId", event.challengeId());
        meta.put("score", event.score());
        if (event.username() != null) {
            meta.put("username", event.username());
        }
        if (event.completionTimeSeconds() != null) {
            meta.put("completionTimeSeconds", event.completionTimeSeconds());
        }
        if (event.challengeTitle() != null && !event.challengeTitle().isBlank()) {
            meta.put("challengeTitle", event.challengeTitle());
        }

        String metadataJson;
        try {
            metadataJson = objectMapper.writeValueAsString(meta);
        } catch (Exception e) {
            metadataJson = "{}";
        }

        Notification n = new Notification();
        n.setUserId(event.userId());
        n.setType(TYPE_SUBMISSION_COMPLETED);
        n.setImportance(NotificationImportance.INFO);
        n.setTitle("Submission graded");
        String challengeLabel = (event.challengeTitle() != null && !event.challengeTitle().isBlank())
                ? "\"" + event.challengeTitle() + "\""
                : "challenge #" + event.challengeId();
        n.setBody(String.format(
                "Your submission for %s scored %d points.",
                challengeLabel,
                event.score()));
        n.setMetadataJson(metadataJson);
        n.setSourceSubmissionId(event.submissionId());

        notificationRepository.save(n);
        NotificationDTO dto = toDto(n);
        long unread = notificationRepository.countByUserIdAndReadAtIsNull(event.userId());
        notificationPushService.pushNewNotification(event.userId(), dto, unread);
        notificationEmailDispatchService.sendEmailIfAlertOrImportant(n);
    }

    /**
     * One in-app welcome per user (first registration). Importance IMPORTANT so it matches default “high” filters.
     */
    @Transactional
    public void createWelcomeNotification(Long userId, String username) {
        if (userId == null) {
            return;
        }
        if (notificationRepository.existsByUserIdAndType(userId, TYPE_WELCOME)) {
            return;
        }
        String display = username != null && !username.isBlank() ? username.trim() : "there";
        Map<String, Object> meta = new HashMap<>();
        meta.put("username", display);

        String metadataJson;
        try {
            metadataJson = objectMapper.writeValueAsString(meta);
        } catch (Exception e) {
            metadataJson = "{}";
        }

        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(TYPE_WELCOME);
        n.setImportance(NotificationImportance.IMPORTANT);
        n.setTitle("Welcome to API Arena");
        n.setBody(String.format(
                "Thanks for joining, %s! Verify your email, then open Challenges or your Dashboard to get started.",
                display));
        n.setMetadataJson(metadataJson);
        n.setSourceSubmissionId(null);

        notificationRepository.save(n);
        NotificationDTO dto = toDto(n);
        long unread = notificationRepository.countByUserIdAndReadAtIsNull(userId);
        notificationPushService.pushNewNotification(userId, dto, unread);
        notificationEmailDispatchService.sendEmailIfAlertOrImportant(n);
    }

    @Transactional(readOnly = true)
    public Page<NotificationDTO> listForUser(Long userId, Boolean unreadOnly, NotificationImportance minImportance, Pageable pageable) {
        List<NotificationImportance> band = NotificationImportance.fromMinimum(minImportance);
        Page<Notification> page;
        if (Boolean.TRUE.equals(unreadOnly)) {
            page = minImportance == null
                    ? notificationRepository.findByUserIdAndReadAtIsNullOrderByCreatedAtDesc(userId, pageable)
                    : notificationRepository.findByUserIdAndReadAtIsNullAndImportanceInOrderByCreatedAtDesc(userId, band, pageable);
        } else if (Boolean.FALSE.equals(unreadOnly)) {
            page = minImportance == null
                    ? notificationRepository.findByUserIdAndReadAtIsNotNullOrderByCreatedAtDesc(userId, pageable)
                    : notificationRepository.findByUserIdAndReadAtIsNotNullAndImportanceInOrderByCreatedAtDesc(userId, band, pageable);
        } else {
            page = minImportance == null
                    ? notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                    : notificationRepository.findByUserIdAndImportanceInOrderByCreatedAtDesc(userId, band, pageable);
        }
        return page.map(this::toDto);
    }

    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return notificationRepository.countByUserIdAndReadAtIsNull(userId);
    }

    @Transactional
    public NotificationDTO markRead(Long userId, Long notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!n.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Forbidden");
        }
        if (n.getReadAt() == null) {
            n.setReadAt(Instant.now());
            notificationRepository.save(n);
        }
        return toDto(n);
    }

    @Transactional
    public int markAllRead(Long userId) {
        return notificationRepository.markAllReadForUser(userId, Instant.now());
    }

    private NotificationDTO toDto(Notification n) {
        Map<String, Object> metadata = null;
        if (n.getMetadataJson() != null && !n.getMetadataJson().isBlank()) {
            try {
                metadata = objectMapper.readValue(n.getMetadataJson(), new TypeReference<>() {});
            } catch (Exception ignored) {
                metadata = Map.of();
            }
        }
        boolean read = n.getReadAt() != null;
        NotificationImportance imp = n.getImportance() != null ? n.getImportance() : NotificationImportance.INFO;
        return new NotificationDTO(
                n.getId(),
                n.getType(),
                imp.name(),
                n.getTitle(),
                n.getBody(),
                metadata,
                read,
                n.getReadAt(),
                n.getCreatedAt());
    }
}
