package com.apiarena.submissionservice.model.services;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.apiarena.submissionservice.repository.ReplayEventRepository;

@Service
public class ReplayRetentionService {

    private static final Logger log = LoggerFactory.getLogger(ReplayRetentionService.class);

    private final ReplayEventRepository replayEventRepository;

    @Value("${replay.retention-days:30}")
    private int retentionDays;

    @Value("${replay.retention.enabled:true}")
    private boolean retentionEnabled;

    public ReplayRetentionService(ReplayEventRepository replayEventRepository) {
        this.replayEventRepository = replayEventRepository;
    }

    @Scheduled(cron = "${replay.retention.cron:0 30 3 * * *}")
    public void cleanupOldReplayEvents() {
        if (!retentionEnabled) {
            return;
        }
        LocalDateTime cutoff = LocalDateTime.now().minusDays(Math.max(1, retentionDays));
        long deleted = replayEventRepository.deleteByOccurredAtBefore(cutoff);
        if (deleted > 0) {
            log.info("Replay retention cleanup deleted {} events older than {}", deleted, cutoff);
        }
    }
}
