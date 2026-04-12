package com.apiarena.submissionservice.model.services;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.apiarena.submissionservice.integration.mongo.ReplayMongoArchiveService;
import com.apiarena.submissionservice.repository.ReplayEventRepository;

@Service
public class ReplayRetentionService {

    private static final Logger log = LoggerFactory.getLogger(ReplayRetentionService.class);

    private final ReplayEventRepository replayEventRepository;

    private final ObjectProvider<ReplayMongoArchiveService> replayMongoArchiveService;

    @Value("${replay.retention-days:30}")
    private int retentionDays;

    @Value("${replay.retention.enabled:true}")
    private boolean retentionEnabled;

    public ReplayRetentionService(ReplayEventRepository replayEventRepository,
            ObjectProvider<ReplayMongoArchiveService> replayMongoArchiveService) {
        this.replayEventRepository = replayEventRepository;
        this.replayMongoArchiveService = replayMongoArchiveService;
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
        ReplayMongoArchiveService mongo = replayMongoArchiveService.getIfAvailable();
        if (mongo != null) {
            long mongoDeleted = mongo.deleteByLastOccurredAtBefore(cutoff);
            if (mongoDeleted > 0) {
                log.info("Mongo replay archives removed: {} (cutoff {})", mongoDeleted, cutoff);
            }
        }
    }
}
