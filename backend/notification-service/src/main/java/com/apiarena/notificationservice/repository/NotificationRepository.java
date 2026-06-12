package com.apiarena.notificationservice.repository;

import java.time.Instant;
import java.util.Collection;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.apiarena.notificationservice.model.entities.Notification;
import com.apiarena.notificationservice.model.entities.NotificationImportance;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    boolean existsByUserIdAndSourceSubmissionId(Long userId, Long sourceSubmissionId);

    boolean existsByUserIdAndType(Long userId, String type);

    boolean existsByUserIdAndTypeAndMetadataJsonContaining(Long userId, String type, String metadataFragment);

    long countByUserIdAndReadAtIsNull(Long userId);

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Notification> findByUserIdAndImportanceInOrderByCreatedAtDesc(
            Long userId, Collection<NotificationImportance> importances, Pageable pageable);

    Page<Notification> findByUserIdAndReadAtIsNullOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Notification> findByUserIdAndReadAtIsNullAndImportanceInOrderByCreatedAtDesc(
            Long userId, Collection<NotificationImportance> importances, Pageable pageable);

    Page<Notification> findByUserIdAndReadAtIsNotNullOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Notification> findByUserIdAndReadAtIsNotNullAndImportanceInOrderByCreatedAtDesc(
            Long userId, Collection<NotificationImportance> importances, Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Notification n SET n.readAt = :readAt WHERE n.userId = :userId AND n.readAt IS NULL")
    int markAllReadForUser(@Param("userId") Long userId, @Param("readAt") Instant readAt);
}
