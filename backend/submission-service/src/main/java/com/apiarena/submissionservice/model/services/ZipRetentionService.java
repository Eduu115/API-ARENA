package com.apiarena.submissionservice.model.services;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.submissionservice.model.entities.Submission;
import com.apiarena.submissionservice.repository.SubmissionRepository;

/**
 * Data minimisation (GDPR art. 5.1.e): deletes uploaded submission ZIPs from disk once they
 * pass the configured availability window. The submission row and scores are kept; only the
 * raw uploaded artifact (which contains the candidate's source code) is removed.
 */
@Service
public class ZipRetentionService {

    private static final Logger log = LoggerFactory.getLogger(ZipRetentionService.class);

    private final SubmissionRepository submissionRepository;

    @Value("${submission.zip-availability-days:90}")
    private int zipAvailabilityDays;

    @Value("${submission.zip-retention.enabled:true}")
    private boolean retentionEnabled;

    public ZipRetentionService(SubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    @Scheduled(cron = "${submission.zip-retention.cron:0 15 3 * * *}")
    @Transactional
    public void cleanupExpiredZips() {
        if (!retentionEnabled) {
            return;
        }
        LocalDateTime cutoff = LocalDateTime.now().minusDays(Math.max(1, zipAvailabilityDays));
        List<Submission> expired = submissionRepository.findByZipFilePathIsNotNullAndCreatedAtBefore(cutoff);
        int removed = 0;
        for (Submission s : expired) {
            String path = s.getZipFilePath();
            if (path == null || path.isBlank()) {
                continue;
            }
            try {
                Files.deleteIfExists(Path.of(path));
            } catch (Exception e) {
                log.warn("Could not delete expired ZIP {} for submission {}: {}", path, s.getId(), e.getMessage());
            }
            // Null the path so the DTO reports the ZIP as no longer downloadable.
            s.setZipFilePath(null);
            removed++;
        }
        if (removed > 0) {
            submissionRepository.saveAll(expired);
            log.info("ZIP retention cleanup removed {} expired upload(s) older than {}", removed, cutoff);
        }
    }
}
