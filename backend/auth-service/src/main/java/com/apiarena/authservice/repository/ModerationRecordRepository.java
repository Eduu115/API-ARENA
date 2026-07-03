package com.apiarena.authservice.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.apiarena.authservice.model.entities.ModerationRecord;

public interface ModerationRecordRepository extends JpaRepository<ModerationRecord, Long> {
    List<ModerationRecord> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByType(String type);

    /** [category, count] for BAN records; null category folded into 'UNCATEGORIZED'. */
    @Query("SELECT COALESCE(m.category, 'UNCATEGORIZED'), COUNT(m) FROM ModerationRecord m "
            + "WHERE m.type = 'BAN' GROUP BY m.category ORDER BY COUNT(m) DESC")
    List<Object[]> banCountByCategory();
}
