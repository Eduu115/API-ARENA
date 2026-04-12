package com.apiarena.submissionservice.integration.influx;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.apiarena.submissionservice.model.entities.Submission;
import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.InfluxDBClientFactory;
import com.influxdb.client.WriteApiBlocking;
import com.influxdb.client.domain.WritePrecision;
import com.influxdb.client.write.Point;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

@Service
@ConditionalOnProperty(name = "influx.enabled", havingValue = "true")
public class InfluxSubmissionMetricsService {

    private static final Logger log = LoggerFactory.getLogger(InfluxSubmissionMetricsService.class);

    @Value("${influx.url:http://localhost:8086}")
    private String url;

    @Value("${influx.token:}")
    private String token;

    @Value("${influx.org:apiarena}")
    private String org;

    @Value("${influx.bucket:metrics}")
    private String bucket;

    private InfluxDBClient client;
    private boolean ready;

    @PostConstruct
    void init() {
        if (token == null || token.isBlank()) {
            log.warn("influx.enabled=true but influx.token is empty — pipeline writes skipped");
            ready = false;
            return;
        }
        try {
            client = InfluxDBClientFactory.create(url, token.toCharArray(), org, bucket);
            ready = true;
        } catch (Exception e) {
            log.warn("Influx client init failed: {}", e.getMessage());
            ready = false;
        }
    }

    @PreDestroy
    void shutdown() {
        if (client != null) {
            client.close();
        }
    }

    public void recordPipelineCompletion(Submission sub, String status, long durationMs) {
        if (!ready || client == null || sub == null || sub.getId() == null) {
            return;
        }
        try {
            double score = sub.getTotalScore() != null ? sub.getTotalScore().doubleValue() : 0.0;
            Point p = Point.measurement("submission_pipeline")
                    .addTag("status", status == null ? "UNKNOWN" : status)
                    .addTag("challenge_id", String.valueOf(sub.getChallengeId()))
                    .addField("submission_id", sub.getId())
                    .addField("user_id", sub.getUserId())
                    .addField("duration_ms", durationMs)
                    .addField("total_score", score)
                    .time(Instant.now(), WritePrecision.MS);
            WriteApiBlocking write = client.getWriteApiBlocking();
            write.writePoint(p);
        } catch (Exception e) {
            log.warn("Influx write failed for submission {}: {}", sub.getId(), e.getMessage());
        }
    }
}
