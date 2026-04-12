package com.apiarena.metricsservice.scheduler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.apiarena.metricsservice.model.services.MetricsAggregationService;

/**
 * Writes CSV snapshots for BI datasets (yesterday UTC) when enabled.
 * Files land in {@code metrics.bi-export.directory} for volume mounts / sidecar pickup.
 */
@Component
@ConditionalOnProperty(name = "metrics.bi-export.enabled", havingValue = "true")
public class BiExportScheduler {

    private static final Logger log = LoggerFactory.getLogger(BiExportScheduler.class);

    private static final List<String> DATASETS = List.of("events", "submissions", "docs_feedback");

    private final MetricsAggregationService aggregationService;
    private final Path exportDirectory;
    private final int rowLimit;

    public BiExportScheduler(
            MetricsAggregationService aggregationService,
            @Value("${metrics.bi-export.directory:/tmp/metrics-bi-exports}") String directory,
            @Value("${metrics.bi-export.row-limit:50000}") int rowLimit) {
        this.aggregationService = aggregationService;
        this.exportDirectory = Path.of(directory);
        this.rowLimit = Math.max(1000, Math.min(100_000, rowLimit));
    }

    @Scheduled(cron = "${metrics.bi-export.cron:0 0 5 * * *}", zone = "UTC")
    public void exportYesterdayUtc() {
        LocalDate day = LocalDate.now(ZoneOffset.UTC).minusDays(1);
        LocalDateTime from = day.atStartOfDay();
        LocalDateTime to = day.plusDays(1).atStartOfDay();
        String fromIso = from.toString();
        String toIso = to.toString();

        try {
            Files.createDirectories(exportDirectory);
        } catch (IOException e) {
            log.error("BI export: cannot create directory {}", exportDirectory, e);
            return;
        }

        for (String dataset : DATASETS) {
            try {
                String csv = aggregationService.exportBiDatasetCsv(dataset, fromIso, toIso, rowLimit);
                String safeName = dataset.replace('-', '_');
                Path out = exportDirectory.resolve(safeName + "-" + day + ".csv");
                Files.writeString(out, csv, StandardCharsets.UTF_8);
                log.info("BI export wrote {} ({} bytes)", out, Files.size(out));
            } catch (Exception e) {
                log.error("BI export failed for dataset {}", dataset, e);
            }
        }
    }
}
