package com.apiarena.notificationservice.model.services;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.notificationservice.kafka.SubmissionCompletedEvent;
import com.apiarena.notificationservice.model.dto.NotificationDTO;
import com.apiarena.notificationservice.model.entities.Notification;
import com.apiarena.notificationservice.repository.NotificationRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class NotificationService {

    public static final String TYPE_SUBMISSION_COMPLETED = "SUBMISSION_COMPLETED";

    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;
    private final NotificationPushService notificationPushService;

    public NotificationService(
            NotificationRepository notificationRepository,
            ObjectMapper objectMapper,
            NotificationPushService notificationPushService
    ) {
        this.notificationRepository = notificationRepository;
        this.objectMapper = objectMapper;
        this.notificationPushService = notificationPushService;
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
    }

    @Transactional(readOnly = true)
    public Page<NotificationDTO> listForUser(Long userId, Boolean unreadOnly, Pageable pageable) {
        Page<Notification> page;
        if (Boolean.TRUE.equals(unreadOnly)) {
            page = notificationRepository.findByUserIdAndReadAtIsNullOrderByCreatedAtDesc(userId, pageable);
        } else if (Boolean.FALSE.equals(unreadOnly)) {
            page = notificationRepository.findByUserIdAndReadAtIsNotNullOrderByCreatedAtDesc(userId, pageable);
        } else {
            page = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
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
        return new NotificationDTO(
                n.getId(),
                n.getType(),
                n.getTitle(),
                n.getBody(),
                metadata,
                read,
                n.getReadAt(),
                n.getCreatedAt());
    }
}
