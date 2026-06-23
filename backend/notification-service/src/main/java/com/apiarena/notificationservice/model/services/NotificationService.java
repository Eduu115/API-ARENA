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
import com.apiarena.notificationservice.model.dto.InternalAchievementUnlockedRequest;
import com.apiarena.notificationservice.model.dto.InternalNewChallengePublishedRequest;
import com.apiarena.notificationservice.model.dto.InternalTeacherSubmissionReviewRequest;
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

    public static final String TYPE_TEACHER_SUBMISSION_REVIEW = "TEACHER_SUBMISSION_REVIEW";

    public static final String TYPE_ACHIEVEMENT_UNLOCKED = "ACHIEVEMENT_UNLOCKED";

    public static final String TYPE_NEW_CHALLENGE_PUBLISHED = "NEW_CHALLENGE_PUBLISHED";

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
        notificationEmailDispatchService.mirrorNotificationToEmail(n);
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
                "Thanks for joining, %s! Your email is verified — open Challenges or your Dashboard to get started.",
                display));
        n.setMetadataJson(metadataJson);
        n.setSourceSubmissionId(null);

        notificationRepository.save(n);
        NotificationDTO dto = toDto(n);
        long unread = notificationRepository.countByUserIdAndReadAtIsNull(userId);
        notificationPushService.pushNewNotification(userId, dto, unread);
        notificationEmailDispatchService.mirrorNotificationToEmail(n);
    }

    /**
     * In-app alert when a teacher saves a submission review (notes, structured feedback, bonuses).
     * Multiple saves may produce multiple notifications so the student sees each update.
     */
    @Transactional
    public void createTeacherSubmissionReviewNotification(InternalTeacherSubmissionReviewRequest body) {
        if (body == null || body.userId() == null || body.submissionId() == null) {
            return;
        }
        Map<String, Object> meta = new HashMap<>();
        meta.put("submissionId", body.submissionId());
        if (body.challengeId() != null) {
            meta.put("challengeId", body.challengeId());
        }
        if (body.challengeTitle() != null && !body.challengeTitle().isBlank()) {
            meta.put("challengeTitle", body.challengeTitle());
        }
        String metadataJson;
        try {
            metadataJson = objectMapper.writeValueAsString(meta);
        } catch (Exception e) {
            metadataJson = "{}";
        }

        String challengeLabel = (body.challengeTitle() != null && !body.challengeTitle().isBlank())
                ? "\"" + body.challengeTitle().trim() + "\""
                : (body.challengeId() != null ? "challenge #" + body.challengeId() : "your challenge");

        Notification n = new Notification();
        n.setUserId(body.userId());
        n.setType(TYPE_TEACHER_SUBMISSION_REVIEW);
        n.setImportance(NotificationImportance.INFO);
        n.setTitle("Teacher feedback on your submission");
        n.setBody(String.format("Open the submission to read notes, structured feedback, and any score bonuses for %s.", challengeLabel));
        n.setMetadataJson(metadataJson);
        n.setSourceSubmissionId(body.submissionId());

        notificationRepository.save(n);
        NotificationDTO dto = toDto(n);
        long unread = notificationRepository.countByUserIdAndReadAtIsNull(body.userId());
        notificationPushService.pushNewNotification(body.userId(), dto, unread);
        notificationEmailDispatchService.mirrorNotificationToEmail(n);
    }

    /**
     * In-app + WebSocket push when the user unlocks an achievement (one notification per achievement code).
     */
    @Transactional
    public void createAchievementUnlockedNotification(InternalAchievementUnlockedRequest body) {
        if (body == null || body.userId() == null || body.achievementCode() == null || body.achievementCode().isBlank()) {
            return;
        }
        String code = body.achievementCode().trim();
        String dedupeFragment = "\"achievementCode\":\"" + code + "\"";
        if (notificationRepository.existsByUserIdAndTypeAndMetadataJsonContaining(
                body.userId(), TYPE_ACHIEVEMENT_UNLOCKED, dedupeFragment)) {
            return;
        }

        String title = body.achievementTitle() != null && !body.achievementTitle().isBlank()
                ? body.achievementTitle().trim()
                : code;
        Map<String, Object> meta = new HashMap<>();
        meta.put("achievementCode", code);
        meta.put("achievementTitle", title);
        if (body.tier() != null && !body.tier().isBlank()) {
            meta.put("tier", body.tier().trim());
        }

        String metadataJson;
        try {
            metadataJson = objectMapper.writeValueAsString(meta);
        } catch (Exception e) {
            metadataJson = "{}";
        }

        Notification n = new Notification();
        n.setUserId(body.userId());
        n.setType(TYPE_ACHIEVEMENT_UNLOCKED);
        n.setImportance(NotificationImportance.INFO);
        n.setTitle("\"" + title + "\" unlocked");
        n.setBody("Achievement unlocked. See more →");
        n.setMetadataJson(metadataJson);
        n.setSourceSubmissionId(null);

        notificationRepository.save(n);
        NotificationDTO dto = toDto(n);
        long unread = notificationRepository.countByUserIdAndReadAtIsNull(body.userId());
        notificationPushService.pushNewNotification(body.userId(), dto, unread);
        notificationEmailDispatchService.mirrorNotificationToEmail(n);
    }

    /**
     * In-app alert for students subscribed to new-challenge emails (INFO only — dedicated email is sent separately).
     */
    @Transactional
    public void createNewChallengePublishedNotification(InternalNewChallengePublishedRequest body) {
        if (body == null || body.userId() == null || body.challengeId() == null) {
            return;
        }

        String loc = body.locale() != null && body.locale().trim().equalsIgnoreCase("es") ? "es" : "en";
        String challengeLabel = body.challengeTitle() != null && !body.challengeTitle().isBlank()
                ? "\"" + body.challengeTitle().trim() + "\""
                : (loc.equals("es") ? "challenge #" + body.challengeId() : "challenge #" + body.challengeId());

        Map<String, Object> meta = new HashMap<>();
        meta.put("challengeId", body.challengeId());
        if (body.challengeTitle() != null && !body.challengeTitle().isBlank()) {
            meta.put("challengeTitle", body.challengeTitle().trim());
        }
        String metadataJson;
        try {
            metadataJson = objectMapper.writeValueAsString(meta);
        } catch (Exception e) {
            metadataJson = "{}";
        }

        Notification n = new Notification();
        n.setUserId(body.userId());
        n.setType(TYPE_NEW_CHALLENGE_PUBLISHED);
        n.setImportance(NotificationImportance.INFO);
        if (loc.equals("es")) {
            n.setTitle("Nuevo challenge publicado");
            n.setBody(String.format("%s ya está en el catálogo. Ábrelo y compite.", challengeLabel));
        } else {
            n.setTitle("New challenge published");
            n.setBody(String.format("%s is now in the catalog. Open it and compete.", challengeLabel));
        }
        n.setMetadataJson(metadataJson);
        n.setSourceSubmissionId(null);

        notificationRepository.save(n);
        NotificationDTO dto = toDto(n);
        long unread = notificationRepository.countByUserIdAndReadAtIsNull(body.userId());
        notificationPushService.pushNewNotification(body.userId(), dto, unread);
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
