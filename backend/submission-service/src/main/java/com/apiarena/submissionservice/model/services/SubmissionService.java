package com.apiarena.submissionservice.model.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZoneId;
import java.util.Optional;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;


import com.apiarena.submissionservice.model.dto.ChallengeAttemptStatusDTO;
import com.apiarena.submissionservice.model.dto.CreateSubmissionResponse;
import com.apiarena.submissionservice.model.dto.LogsResponse;
import com.apiarena.submissionservice.model.dto.ReplayEventDTO;
import com.apiarena.submissionservice.model.dto.ReplayTimelineResponse;
import com.apiarena.submissionservice.model.dto.SubmissionDTO;
import com.apiarena.submissionservice.model.dto.SubmissionStatusCacheDTO;
import com.apiarena.submissionservice.model.dto.TeacherManualScoresRequest;
import com.apiarena.submissionservice.model.dto.TeacherBonusLineRequest;
import com.apiarena.submissionservice.model.dto.TeacherPenaltyApplyRequest;
import com.apiarena.submissionservice.model.dto.TeacherPenaltiesBatchConfirmRequest;
import com.apiarena.submissionservice.model.dto.TeacherSubmissionReviewRequest;
import com.apiarena.submissionservice.kafka.SubmissionCompletedEvent;
import com.apiarena.submissionservice.kafka.SubmissionKafkaPublisher;
import com.apiarena.submissionservice.model.dto.SubmissionSummaryDTO;
import com.apiarena.submissionservice.model.dto.SubmissionZipDownload;
import com.apiarena.submissionservice.model.entities.ReplayEvent;
import com.apiarena.submissionservice.model.entities.Submission;
import com.apiarena.submissionservice.repository.ReplayEventRepository;
import com.apiarena.submissionservice.repository.SubmissionRepository;
import com.apiarena.submissionservice.integration.influx.InfluxSubmissionMetricsService;
import com.apiarena.submissionservice.integration.mongo.ReplayMongoArchiveService;

@Service
public class SubmissionService implements ISubmissionService {

    private static final Logger log = LoggerFactory.getLogger(SubmissionService.class);

    private static final BigDecimal MAX_SINGLE_PENALTY = new BigDecimal("300");
    private static final BigDecimal MAX_TOTAL_SCORE = new BigDecimal("1000");
    private static final Duration TEACHER_PENALTY_REVOCATION_WINDOW = Duration.ofHours(2);
    private static final Map<String, BigDecimal> TEACHER_PRESET_PENALTIES = Map.of(
            "WRONG_DELIVERABLE_NAME", new BigDecimal("40"),
            "SPELLING_AND_DOCS", new BigDecimal("15"),
            "CODE_DISORGANIZATION", new BigDecimal("25"),
            "MISSING_README", new BigDecimal("20"),
            "STYLE_AND_NAMING", new BigDecimal("15"));
    private static final Map<String, String> TEACHER_PRESET_LABELS = Map.of(
            "WRONG_DELIVERABLE_NAME", "Wrong deliverable / archive name",
            "SPELLING_AND_DOCS", "Spelling and documentation issues",
            "CODE_DISORGANIZATION", "Code disorganization / structure",
            "MISSING_README", "Missing or broken README",
            "STYLE_AND_NAMING", "Style and naming inconsistencies",
            "OTHER", "Other (custom)");

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private UploadStorageService uploadStorageService;

    @Autowired
    private SubmissionStatusCacheService statusCacheService;

    @Autowired
    private SubmissionWebSocketService webSocketService;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private SubmissionKafkaPublisher submissionKafkaPublisher;

    @Autowired
    private ReplayEventRepository replayEventRepository;

    @Autowired(required = false)
    private ReplayMongoArchiveService replayMongoArchiveService;

    @Autowired(required = false)
    private InfluxSubmissionMetricsService influxSubmissionMetricsService;

    @Value("${services.auth-url:http://localhost:8081}")
    private String authServiceUrl;

    @Value("${services.challenge-url:http://localhost:8082}")
    private String challengeServiceUrl;

    @Value("${services.sandbox-url:http://localhost:8084}")
    private String sandboxServiceUrl;

    @Value("${services.testing-url:http://localhost:8085}")
    private String testingServiceUrl;

    @Value("${services.ai-review-url:http://localhost:8086}")
    private String aiReviewServiceUrl;

    @Value("${services.candidate-host:localhost}")
    private String candidateApiHost;

    @Value("${apiarena.submission.max-attempts-per-day-per-challenge:3}")
    private int maxAttemptsPerDayPerChallenge;

    @Value("${submission.zip-availability-days:90}")
    private int zipAvailabilityDays;

    @Value("${services.internal-token:}")
    private String internalToken;

    @Value("${services.notification-url:http://localhost:8090}")
    private String notificationServiceUrl;

    @Value("${ai.review.enabled:false}")
    private boolean aiReviewEnabled;

    @Value("${replay.source:structured}")
    private String replaySource;

    @Override
    public ChallengeAttemptStatusDTO getChallengeAttemptStatus(Long userId, Long challengeId) {
        return computeChallengeAttemptStatus(userId, challengeId);
    }

    private ChallengeAttemptStatusDTO computeChallengeAttemptStatus(Long userId, Long challengeId) {
        Map<String, Object> ch = fetchChallengeData(challengeId);
        int timeLimitMin = ch.get("timeLimitMinutes") != null
                ? ((Number) ch.get("timeLimitMinutes")).intValue()
                : 60;

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime startOfDayUtc = LocalDate.now(ZoneOffset.UTC).atStartOfDay();
        long usedToday = submissionRepository.countByUserIdAndChallengeIdAndCreatedAtGreaterThanEqual(
                userId, challengeId, startOfDayUtc);

        if (usedToday >= maxAttemptsPerDayPerChallenge) {
            Instant nextUtcMidnight = LocalDate.now(ZoneOffset.UTC)
                    .plusDays(1)
                    .atStartOfDay(ZoneOffset.UTC)
                    .toInstant();
            return ChallengeAttemptStatusDTO.blockedDaily(
                    (int) usedToday, maxAttemptsPerDayPerChallenge, nextUtcMidnight.toString());
        }

        Optional<Submission> lastOpt = submissionRepository.findFirstByUserIdAndChallengeIdOrderByCreatedAtDesc(
                userId, challengeId);
        if (lastOpt.isPresent()) {
            LocalDateTime nextAllowed = lastOpt.get().getCreatedAt().plusMinutes(timeLimitMin);
            if (now.isBefore(nextAllowed)) {
                Instant cooldownEnd = nextAllowed.atZone(ZoneOffset.UTC).toInstant();
                return ChallengeAttemptStatusDTO.blockedCooldown(
                        (int) usedToday, maxAttemptsPerDayPerChallenge, cooldownEnd.toString());
            }
        }
        return ChallengeAttemptStatusDTO.allowed((int) usedToday, maxAttemptsPerDayPerChallenge);
    }

    private void assertChallengeSubmissionAllowed(Long userId, Long challengeId, boolean rateLimitBypass) {
        if (rateLimitBypass) {
            return;
        }
        ChallengeAttemptStatusDTO status = computeChallengeAttemptStatus(userId, challengeId);
        if (status.allowed()) {
            return;
        }
        if (ChallengeAttemptStatusDTO.REASON_DAILY_LIMIT.equals(status.blockReason())) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Daily submission limit for this challenge reached ("
                            + maxAttemptsPerDayPerChallenge + " per UTC day). Resets at "
                            + status.dailyLimitResetsAtIso());
        }
        if (ChallengeAttemptStatusDTO.REASON_COOLDOWN.equals(status.blockReason())) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Challenge cooldown active. You can submit again after "
                            + status.cooldownUntilIso() + " (UTC), based on this challenge's time limit.");
        }
        throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Cannot submit this challenge right now.");
    }

    private static Integer sanitizeDevelopmentSeconds(Integer raw, int timeLimitMinutes) {
        if (raw == null || raw <= 0) {
            return null;
        }
        int max = timeLimitMinutes * 60 + 300;
        return Math.min(raw, max);
    }

    private void notifyAuthDevelopmentTime(Long userId, int seconds) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, Integer> body = Map.of("seconds", seconds);
            HttpEntity<Map<String, Integer>> entity = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(
                    authServiceUrl + "/internal/users/" + userId + "/development-time",
                    entity,
                    Void.class);
        } catch (Exception e) {
            log.warn("Failed to sync development time to auth for user {}: {}", userId, e.getMessage());
        }
    }

    @Override
    @Transactional
    public CreateSubmissionResponse createSubmission(Long challengeId, Long userId, MultipartFile zipFile,
            boolean rateLimitBypass, Integer developmentTimeSeconds) {

        if (challengeId == null) {
            throw new IllegalArgumentException("Challenge ID is required");
        }
        if (userId == null) {
            throw new IllegalArgumentException("User must be authenticated");
        }

        assertChallengeSubmissionAllowed(userId, challengeId, rateLimitBypass);

        Map<String, Object> ch = fetchChallengeData(challengeId);
        int timeLimitMin = ch.get("timeLimitMinutes") != null
                ? ((Number) ch.get("timeLimitMinutes")).intValue()
                : 60;
        Integer devSec = sanitizeDevelopmentSeconds(developmentTimeSeconds, timeLimitMin);

        Submission submission = Submission.builder()
                .challengeId(challengeId)
                .userId(userId)
                .status(Submission.Status.PENDING)
                .developmentTimeSeconds(devSec)
                .build();

        Submission saved = submissionRepository.save(submission);
        recordReplay(saved.getId(), "SUBMISSION", "SUBMISSION_CREATED", "info",
                "Submission created and queued", Map.of("challengeId", challengeId, "userId", userId));

        String zipFilePath = uploadStorageService.storeZip(zipFile, saved.getId());
        saved.setZipFilePath(zipFilePath);
        saved.setStatus(Submission.Status.PENDING);
        saved = submissionRepository.save(saved);

        if (devSec != null && devSec > 0) {
            notifyAuthDevelopmentTime(userId, devSec);
            recordReplay(saved.getId(), "SUBMISSION", "DEVELOPMENT_TIME_REPORTED", "info",
                    "Development time synced", Map.of("developmentTimeSeconds", devSec));
        }

        statusCacheService.cacheStatus(saved);

        SubmissionStatusCacheDTO cacheDto = SubmissionStatusCacheDTO.fromEntity(saved);
        webSocketService.sendStatusUpdate(saved.getId(), cacheDto);

        String wsTopic = webSocketService.getWsTopicForSubmission(saved.getId());

        final Long subId = saved.getId();
        // Defer pipeline until after commit: otherwise findById in the new thread may not see the row yet.
        Runnable startPipeline = () -> new Thread(() -> runSubmissionPipeline(subId)).start();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    startPipeline.run();
                }
            });
        } else {
            startPipeline.run();
        }

        return new CreateSubmissionResponse(saved.getId(), saved.getStatus().name(), wsTopic);
    }

    @SuppressWarnings("unchecked")
    private void runSubmissionPipeline(Long submissionId) {
        final long pipelineT0 = System.currentTimeMillis();
        try {
            Submission sub = submissionRepository.findById(submissionId).orElse(null);
            if (sub == null) {
                log.warn("runSubmissionPipeline: submission {} not found (possible race); skipping", submissionId);
                return;
            }

            recordReplay(submissionId, "BUILD", "BUILD_STARTED", "info", "Starting sandbox build", null);
            updateStatus(submissionId, Submission.Status.BUILDING, null);

            Map<String, Object> buildReq = new HashMap<>();
            buildReq.put("submissionId", submissionId);
            buildReq.put("zipFilePath", sub.getZipFilePath());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            applyInternalToken(headers);
            HttpEntity<Map<String, Object>> buildEntity = new HttpEntity<>(buildReq, headers);

            Map<String, Object> exec = restTemplate.postForObject(
                    sandboxServiceUrl + "/internal/sandbox/build", buildEntity, Map.class);

            if (exec == null) {
                recordReplay(submissionId, "BUILD", "BUILD_FAILED", "error", "Sandbox returned empty response", null);
                updateStatus(submissionId, Submission.Status.FAILED, "Sandbox returned empty response");
                recordInfluxIfEnabled(submissionId, "FAILED", pipelineT0);
                return;
            }

            Object bl = exec.get("buildLogs");
            if (bl != null) {
                appendBuildLogs(submissionId, bl.toString());
            }

            String sandboxStatus = Objects.toString(exec.get("status"), "");
            if ("FAILED".equals(sandboxStatus)) {
                String err = Objects.toString(exec.get("errorMessage"), "Sandbox build failed");
                recordReplay(submissionId, "BUILD", "BUILD_FAILED", "error", err, null);
                updateStatus(submissionId, Submission.Status.FAILED, err);
                recordInfluxIfEnabled(submissionId, "FAILED", pipelineT0);
                return;
            }

            Number portNum = (Number) exec.get("exposedPort");
            int port = portNum != null ? portNum.intValue() : 9100;
            String candidateHost = Objects.toString(exec.get("candidateHost"), candidateApiHost);
            String candidateUrl = String.format("http://%s:%d", candidateHost, port);
            recordReplay(submissionId, "BUILD", "CONTAINER_READY", "info",
                    "Candidate API is ready",
                    Map.of("candidateHost", candidateHost, "port", port, "candidateUrl", candidateUrl));

            recordReplay(submissionId, "TESTING", "TESTING_STARTED", "info", "Dispatching tests", null);
            updateStatus(submissionId, Submission.Status.TESTING, null);

            Map<String, Object> challenge = fetchChallengeData(sub.getChallengeId());

            Map<String, Object> testSuitePayload = new LinkedHashMap<>();
            Object ts = challenge.get("testSuite");
            if (ts instanceof Map<?, ?> m) {
                for (Map.Entry<?, ?> e : m.entrySet()) {
                    if (e.getKey() != null && e.getValue() != null) {
                        testSuitePayload.put(e.getKey().toString(), e.getValue());
                    }
                }
            }
            if (challenge.get("requiredEndpoints") != null) {
                testSuitePayload.putIfAbsent("requiredEndpoints", challenge.get("requiredEndpoints"));
            }

            Map<String, Object> testReq = new LinkedHashMap<>();
            testReq.put("submissionId", submissionId);
            testReq.put("challengeId", sub.getChallengeId());
            testReq.put("containerUrl", candidateUrl);
            testReq.put("testSuite", testSuitePayload);
            testReq.put("performanceRequirements", challenge.get("performanceRequirements"));
            testReq.put("designCriteria", challenge.get("designCriteria"));

            HttpEntity<Map<String, Object>> testEntity = new HttpEntity<>(testReq, headers);
            Map<String, Object> suite = restTemplate.postForObject(
                    testingServiceUrl + "/internal/testing/run", testEntity, Map.class);

            if (suite == null) {
                recordReplay(submissionId, "TESTING", "TESTING_FAILED", "error",
                        "Testing service returned empty response", null);
                updateStatus(submissionId, Submission.Status.FAILED, "Testing service returned empty response");
                recordInfluxIfEnabled(submissionId, "FAILED", pipelineT0);
                return;
            }

            StringBuilder testLog = new StringBuilder();
            List<Map<String, Object>> results = (List<Map<String, Object>>) suite.get("results");
            if (results != null) {
                int testIndex = 0;
                for (Map<String, Object> tr : results) {
                    String name = Objects.toString(tr.get("testName"), "?");
                    String st = Objects.toString(tr.get("status"), "?");
                    String ac = Objects.toString(tr.get("actualResult"), "");
                    testLog.append(String.format("[TEST] %s => %s %s%n", name, st, ac));
                    Map<String, Object> meta = new LinkedHashMap<>();
                    meta.put("testIndex", testIndex++);
                    meta.put("testName", name);
                    meta.put("status", st);
                    meta.put("actualResult", ac);
                    meta.put("testType", Objects.toString(tr.get("testType"), "UNKNOWN"));
                    if (tr.get("executionTimeMs") != null) meta.put("executionTimeMs", tr.get("executionTimeMs"));
                    if (tr.get("requestMethod") != null) meta.put("requestMethod", tr.get("requestMethod"));
                    if (tr.get("requestPath") != null) meta.put("requestPath", tr.get("requestPath"));
                    if (tr.get("responseStatus") != null) meta.put("responseStatus", tr.get("responseStatus"));
                    recordReplay(submissionId, "TESTING", "TEST_CASE_RESULT",
                            "PASSED".equalsIgnoreCase(st) ? "info" : "warn",
                            name + " => " + st,
                            meta);
                }
                testLog.append(String.format("%n[RESULT] %s/%s tests passed (total score %s)%n",
                        Objects.toString(suite.get("passed"), "?"),
                        Objects.toString(suite.get("totalTests"), "?"),
                        Objects.toString(suite.get("totalScore"), "?")));
            }
            appendTestLogs(submissionId, testLog.toString());

            int total = toInt(suite.get("totalScore"));
            int corr = toInt(suite.get("correctnessScore"));
            int perf = toInt(suite.get("performanceScore"));
            int design = toInt(suite.get("designScore"));

            ScoreBreakdown technical = buildTechnicalBreakdown(total, corr, perf, design);
            AiReviewOutcome aiOutcome = runAiReview(submissionId, sub.getChallengeId(), results, technical);
            BigDecimal aiScoreBd = BigDecimal.valueOf(aiOutcome.aiScore()).setScale(2, RoundingMode.HALF_UP);
            persistAiReview(submissionId, aiOutcome, aiScoreBd);

            int finalTotal = Math.min(1000, technical.technicalTotal() + aiOutcome.aiScore());
            BigDecimal totalBd = BigDecimal.valueOf(finalTotal).setScale(2, RoundingMode.HALF_UP);
            BigDecimal corrBd = BigDecimal.valueOf(technical.correctness()).setScale(2, RoundingMode.HALF_UP);
            BigDecimal perfBd = BigDecimal.valueOf(technical.performance()).setScale(2, RoundingMode.HALF_UP);
            BigDecimal designBd = BigDecimal.valueOf(technical.design()).setScale(2, RoundingMode.HALF_UP);

            updateScores(submissionId, totalBd, corrBd, perfBd, designBd);
            recordReplay(submissionId, "RESULT", "SCORE_FINALIZED", "info",
                    "Scores finalized with AI review",
                    Map.of("totalScore", totalBd,
                            "technicalScore", technical.technicalTotal(),
                            "correctnessScore", corrBd,
                            "performanceScore", perfBd,
                            "designScore", designBd,
                            "aiReviewScore", aiScoreBd));
            applyMetricsFromResults(submissionId, results);

            calculateAndApplyRewards(submissionId);
            recordInfluxIfEnabled(submissionId, "COMPLETED", pipelineT0);

        } catch (Exception e) {
            log.error("Submission pipeline failed for {}", submissionId, e);
            recordReplay(submissionId, "PIPELINE", "PIPELINE_FAILED", "error",
                    e.getMessage() != null ? e.getMessage() : "Pipeline failed", null);
            updateStatus(submissionId, Submission.Status.FAILED,
                    e.getMessage() != null ? e.getMessage() : "Pipeline failed");
            recordInfluxIfEnabled(submissionId, "FAILED", pipelineT0);
        } finally {
            try {
                restTemplate.exchange(
                        sandboxServiceUrl + "/internal/sandbox/stop/" + submissionId,
                        HttpMethod.POST,
                        new HttpEntity<>(buildInternalHeaders()),
                        Map.class);
                recordReplay(submissionId, "CLEANUP", "SANDBOX_STOP_REQUESTED", "info",
                        "Sandbox stop requested", null);
            } catch (Exception e) {
                log.warn("Sandbox stop after submission {}: {}", submissionId, e.getMessage());
                recordReplay(submissionId, "CLEANUP", "SANDBOX_STOP_FAILED", "warn", e.getMessage(), null);
            }
        }
    }

    private void recordReplay(Long submissionId, String stage, String eventType, String severity, String message,
            Map<String, Object> metadata) {
        if (submissionId == null) {
            return;
        }
        try {
            ReplayEvent ev = ReplayEvent.builder()
                    .submissionId(submissionId)
                    .stage(stage)
                    .eventType(eventType)
                    .severity(severity != null ? severity : "info")
                    .message(message)
                    .metadata(metadata)
                    .build();
            ReplayEvent saved = replayEventRepository.save(ev);
            if (replayMongoArchiveService != null) {
                replayMongoArchiveService.appendEvent(saved);
            }
        } catch (Exception e) {
            log.warn("Could not persist replay event {} for submission {}: {}", eventType, submissionId, e.getMessage());
        }
    }

    private void recordInfluxIfEnabled(Long submissionId, String status, long pipelineStartedAtMs) {
        if (influxSubmissionMetricsService == null || submissionId == null) {
            return;
        }
        long elapsed = System.currentTimeMillis() - pipelineStartedAtMs;
        submissionRepository.findById(submissionId).ifPresent(sub ->
                influxSubmissionMetricsService.recordPipelineCompletion(sub, status, elapsed));
    }

    private HttpHeaders buildInternalHeaders() {
        HttpHeaders headers = new HttpHeaders();
        applyInternalToken(headers);
        return headers;
    }

    private void applyInternalToken(HttpHeaders headers) {
        if (internalToken != null && !internalToken.isBlank()) {
            headers.set("X-Internal-Token", internalToken);
        }
    }

    private static int toInt(Object o) {
        if (o instanceof Number n) {
            return n.intValue();
        }
        return 0;
    }

    private void applyMetricsFromResults(Long submissionId, List<Map<String, Object>> results) {
        if (results == null || results.isEmpty()) {
            return;
        }
        Submission sub = submissionRepository.findById(submissionId).orElse(null);
        if (sub == null) {
            return;
        }
        double sumMs = 0;
        int nFn = 0;
        int failed = 0;
        for (Map<String, Object> tr : results) {
            if (!"FUNCTIONAL".equals(String.valueOf(tr.get("testType")))) {
                continue;
            }
            if (!"PASSED".equals(String.valueOf(tr.get("status")))) {
                failed++;
            }
            Object et = tr.get("executionTimeMs");
            if (et instanceof Number) {
                sumMs += ((Number) et).doubleValue();
                nFn++;
            }
        }
        if (nFn > 0) {
            int avg = (int) Math.max(1, sumMs / nFn);
            sub.setAvgResponseMs(avg);
            sub.setP95ResponseMs((int) (avg * 1.5));
            sub.setP99ResponseMs((int) (avg * 2.2));
            sub.setRps(Math.min(5000, 1000 / avg));
        }
        sub.setTotalRequests(results.size());
        sub.setFailedRequests(failed);
        sub.setRestComplianceScore(BigDecimal.valueOf(85).setScale(2, RoundingMode.HALF_UP));
        submissionRepository.save(sub);
    }

    private AiReviewOutcome runAiReview(Long submissionId, Long challengeId, List<Map<String, Object>> results,
            ScoreBreakdown technical) {
        if (!aiReviewEnabled) {
            return AiReviewOutcome.disabled();
        }
        try {
            Submission sub = submissionRepository.findById(submissionId).orElse(null);
            if (sub == null) {
                return AiReviewOutcome.failed("submission_not_found");
            }
            HttpHeaders headers = buildInternalHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            List<String> endpoints = List.of();
            if (results != null) {
                endpoints = results.stream()
                        .map(r -> Objects.toString(r.get("requestPath"), null))
                        .filter(Objects::nonNull)
                        .distinct()
                        .toList();
            }
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("submissionId", submissionId);
            body.put("challengeId", challengeId);
            body.put("buildLogs", sub.getBuildLogs());
            body.put("testLogs", sub.getTestLogs());
            body.put("endpoints", endpoints);
            body.put("technicalScore", technical.technicalTotal());
            body.put("correctnessScore", technical.correctness());
            body.put("performanceScore", technical.performance());
            body.put("designScore", technical.design());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            @SuppressWarnings("unchecked")
            Map<String, Object> review = restTemplate.postForObject(
                    aiReviewServiceUrl + "/internal/ai-review/analyze",
                    entity,
                    Map.class);
            if (review == null) {
                return AiReviewOutcome.failed("empty_response");
            }
            int aiScore = toInt(review.get("aiScore"));
            if (aiScore <= 0) {
                aiScore = toInt(review.get("score"));
            }
            aiScore = Math.max(0, Math.min(200, aiScore));
            Object providerObj = review.get("provider");
            String provider = providerObj != null ? providerObj.toString() : "heuristic";

            Map<String, Object> aiDetails = new LinkedHashMap<>();
            aiDetails.put("provider", provider);
            aiDetails.put("summary", Objects.toString(review.get("summary"), ""));
            aiDetails.put("overallScore", toInt(review.get("overallScore")));
            aiDetails.put("performanceScore", toInt(review.get("performanceScore")));
            aiDetails.put("aestheticsScore", toInt(review.get("aestheticsScore")));
            aiDetails.put("cleanlinessScore", toInt(review.get("cleanlinessScore")));
            aiDetails.put("structureScore", toInt(review.get("structureScore")));
            aiDetails.put("strengths", review.get("strengths"));
            aiDetails.put("suggestions", review.get("suggestions"));
            aiDetails.put("diagnostics", review.get("diagnostics"));

            recordReplay(submissionId, "RESULT", "AI_REVIEW_COMPLETED", "info",
                    "AI review completed", Map.of("aiReviewScore", aiScore, "provider", provider));
            return new AiReviewOutcome(aiScore, provider, aiDetails);
        } catch (Exception e) {
            log.warn("AI review skipped for submission {}: {}", submissionId, e.getMessage());
            recordReplay(submissionId, "RESULT", "AI_REVIEW_FAILED", "warn", e.getMessage(), null);
            return AiReviewOutcome.failed(e.getMessage());
        }
    }

    private void persistAiReview(Long submissionId, AiReviewOutcome aiOutcome, BigDecimal aiScore) {
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) {
            return;
        }
        submission.setAiReviewScore(aiScore);
        submission.setAiSuggestions(aiOutcome.details());
        submissionRepository.save(submission);
    }

    private ScoreBreakdown buildTechnicalBreakdown(int total, int correctness, int performance, int design) {
        int sum = Math.max(0, correctness) + Math.max(0, performance) + Math.max(0, design);
        if (sum > 0) {
            int corrWeighted = (int) Math.round(300.0 * Math.max(0, correctness) / sum);
            int perfWeighted = (int) Math.round(300.0 * Math.max(0, performance) / sum);
            int designWeighted = (int) Math.round(200.0 * Math.max(0, design) / sum);

            int technicalTotal = corrWeighted + perfWeighted + designWeighted;
            int delta = 800 - technicalTotal;
            if (delta != 0) {
                designWeighted = Math.max(0, designWeighted + delta);
                technicalTotal = corrWeighted + perfWeighted + designWeighted;
            }
            return new ScoreBreakdown(corrWeighted, perfWeighted, designWeighted, Math.max(0, technicalTotal));
        }
        int technicalTotal = Math.max(0, Math.min(800, (int) Math.round(Math.max(0, total) * 0.8)));
        int corrWeighted = (int) Math.round(technicalTotal * 0.375); // 300/800
        int perfWeighted = (int) Math.round(technicalTotal * 0.375); // 300/800
        int designWeighted = Math.max(0, technicalTotal - corrWeighted - perfWeighted); // 200/800
        return new ScoreBreakdown(corrWeighted, perfWeighted, designWeighted, technicalTotal);
    }

    private record ScoreBreakdown(int correctness, int performance, int design, int technicalTotal) {}

    private record AiReviewOutcome(int aiScore, String provider, Map<String, Object> details) {
        private static AiReviewOutcome disabled() {
            return new AiReviewOutcome(0, "disabled", Map.of(
                    "provider", "disabled",
                    "summary", "AI review disabled",
                    "suggestions", List.of(),
                    "strengths", List.of()));
        }

        private static AiReviewOutcome failed(String reason) {
            return new AiReviewOutcome(0, "fallback", Map.of(
                    "provider", "fallback",
                    "summary", "AI review unavailable, score defaults to 0.",
                    "suggestions", List.of("Retry submission review after AI service stabilizes."),
                    "diagnostics", Map.of("reason", reason)));
        }
    }

    private static final Map<String, Integer> DIFFICULTY_RATING = Map.of(
            "EASY", 800, "MEDIUM", 1200, "HARD", 1600, "EXPERT", 2000);
    private static final Map<String, Double> DIFFICULTY_ELO_MULTIPLIER = Map.of(
            "EASY", 0.0, "MEDIUM", 1.0, "HARD", 1.4, "EXPERT", 1.8);
    private static final int MIN_RANKED_CHALLENGES = 3;
    /** Extra ELO weight when a repeat completion scores below the player's previous best on this challenge. */
    private static final double ELO_REPEAT_REGRESSION_WEIGHT = 0.35;
    /** Minimum loss when score is below expectation but base formula rounds to zero. */
    private static final int ELO_MIN_UNDERPERFORM_PENALTY = 4;
    private static final double ELO_VERY_BAD_SCORE_THRESHOLD = 0.32;
    private static final double ELO_VERY_BAD_EXTRA_WEIGHT = 1.75;
    private static final int ELO_CHANGE_FLOOR_PER_SUBMISSION = -90;

    @SuppressWarnings("unchecked")
    private void calculateAndApplyRewards(Long submissionId) {
        try {
            Submission sub = submissionRepository.findById(submissionId).orElse(null);
            if (sub == null || sub.getStatus() != Submission.Status.COMPLETED) return;

            Map<String, Object> challengeData = fetchChallengeData(sub.getChallengeId());
            int xpReward = challengeData.get("xpReward") != null
                    ? ((Number) challengeData.get("xpReward")).intValue() : 200;
            String difficulty = (String) challengeData.getOrDefault("difficulty", "MEDIUM");

            double totalScore = sub.getTotalScore() != null ? sub.getTotalScore().doubleValue() : 0;
            double scoreRatio = totalScore / 1000.0;

            List<Submission> previousBest = submissionRepository.findBestCompletedExcluding(
                    sub.getUserId(), sub.getChallengeId(), sub.getId());

            boolean isFirst = previousBest.isEmpty();
            BigDecimal prevBest = isFirst ? null :
                    (previousBest.get(0).getTotalScore() != null ? previousBest.get(0).getTotalScore() : BigDecimal.ZERO);
            double prevBestVal = prevBest != null ? prevBest.doubleValue() : 0;
            boolean improved = !isFirst && totalScore > prevBestVal;

            // --- XP calculation (constant, slight difficulty variation) ---
            int xpEarned;
            if (isFirst) {
                xpEarned = (int) Math.floor(xpReward * scoreRatio);
            } else if (improved) {
                double improvement = (totalScore - prevBestVal) / 1000.0;
                xpEarned = (int) Math.floor(xpReward * improvement * 0.8);
            } else {
                xpEarned = Math.max(1, (int) Math.floor(xpReward * 0.02));
            }

            // --- ELO calculation (dynamic, competitive, can go negative) ---
            // EASY challenges do NOT affect ELO; higher difficulty = bigger impact
            double eloMultiplier = DIFFICULTY_ELO_MULTIPLIER.getOrDefault(difficulty, 1.0);
            int eloChange = 0;

            if (eloMultiplier > 0) {
                int currentElo = fetchUserRating(sub.getUserId());
                int challengeRating = DIFFICULTY_RATING.getOrDefault(difficulty, 1200);
                int totalChallenges = fetchUserTotalChallenges(sub.getUserId());

                int K = totalChallenges < 10 ? 48 : 32;
                double expected = 1.0 / (1.0 + Math.pow(10.0, (challengeRating - currentElo) / 400.0));
                eloChange = (int) Math.round(K * eloMultiplier * (scoreRatio - expected));

                // Worse than your own previous best on this challenge (repeat) — extra ELO downside
                if (!isFirst && totalScore + 1e-6 < prevBestVal) {
                    double regression = (prevBestVal - totalScore) / 1000.0;
                    int repeatPenalty = (int) Math.round(K * eloMultiplier * ELO_REPEAT_REGRESSION_WEIGHT * regression);
                    eloChange -= Math.max(3, repeatPenalty);
                }

                // Base formula can round to 0 while still below expectation — keep a small guaranteed loss
                if (scoreRatio + 1e-9 < expected && eloChange >= 0) {
                    eloChange = -Math.max(ELO_MIN_UNDERPERFORM_PENALTY,
                            (int) Math.round(K * eloMultiplier * 0.09));
                }

                // Very low score / "muy mal": additional penalty (applies to repeats as well)
                if (scoreRatio < ELO_VERY_BAD_SCORE_THRESHOLD) {
                    double gap = ELO_VERY_BAD_SCORE_THRESHOLD - scoreRatio;
                    int veryBadExtra = (int) Math.round(K * eloMultiplier * ELO_VERY_BAD_EXTRA_WEIGHT * gap);
                    eloChange -= Math.max(0, veryBadExtra);
                }

                eloChange = Math.max(ELO_CHANGE_FLOOR_PER_SUBMISSION, eloChange);
            }

            sub.setXpEarned(xpEarned);
            sub.setEloChange(eloChange);
            sub.setPreviousBestScore(prevBest);
            sub.setIsFirstCompletion(isFirst);
            submissionRepository.save(sub);

            log.info("Rewards calculated for sub {}: xp={}, elo={}, difficulty={}, multiplier={}",
                    submissionId, xpEarned, eloChange, difficulty, eloMultiplier);

            Integer completionSeconds = null;
            if (sub.getCreatedAt() != null && sub.getCompletedAt() != null) {
                completionSeconds = (int) Math.max(0L,
                        Duration.between(sub.getCreatedAt(), sub.getCompletedAt()).getSeconds());
            }
            String username = fetchUsername(sub.getUserId());
            int scoreInt = sub.getTotalScore() != null ? sub.getTotalScore().intValue() : 0;
            String challengeTitle = null;
            Object titleObj = challengeData.get("title");
            if (titleObj != null) {
                challengeTitle = Objects.toString(titleObj, null);
            }
            submissionKafkaPublisher.publishSubmissionCompleted(
                    SubmissionCompletedEvent.of(
                            sub.getId(),
                            sub.getUserId(),
                            sub.getChallengeId(),
                            challengeTitle,
                            username,
                            scoreInt,
                            completionSeconds));

            try {
                Map<String, Object> rewardBody = Map.of(
                        "xpEarned", xpEarned,
                        "eloChange", eloChange,
                        "isFirstCompletion", isFirst
                );
                restTemplate.postForEntity(
                        authServiceUrl + "/internal/users/" + sub.getUserId() + "/reward",
                        rewardBody, Void.class);
            } catch (Exception e) {
                log.error("Failed to apply rewards to auth-service for submission {}: {}",
                        submissionId, e.getMessage());
            }

        } catch (Exception e) {
            log.error("Failed to calculate rewards for submission {}: {}", submissionId, e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private String fetchUsername(Long userId) {
        try {
            Map<String, Object> profile = restTemplate.getForObject(
                    authServiceUrl + "/api/auth/users/" + userId + "/profile", Map.class);
            if (profile != null && profile.get("username") != null) {
                return Objects.toString(profile.get("username"), "user-" + userId);
            }
        } catch (Exception e) {
            log.warn("Could not fetch username for user {}: {}", userId, e.getMessage());
        }
        return "user-" + userId;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchChallengeData(Long challengeId) {
        try {
            Map<String, Object> challenge = restTemplate.getForObject(
                    challengeServiceUrl + "/api/challenges/" + challengeId, Map.class);
            if (challenge != null) return challenge;
        } catch (Exception e) {
            log.warn("Could not fetch challenge {}: {}", challengeId, e.getMessage());
        }
        return Map.of("xpReward", 200, "difficulty", "MEDIUM", "timeLimitMinutes", 60);
    }

    @SuppressWarnings("unchecked")
    private int fetchUserRating(Long userId) {
        try {
            Map<String, Object> profile = restTemplate.getForObject(
                    authServiceUrl + "/api/auth/users/" + userId + "/profile", Map.class);
            if (profile != null && profile.get("rating") != null) {
                return ((Number) profile.get("rating")).intValue();
            }
        } catch (Exception e) {
            log.warn("Could not fetch user {} rating, using 1000: {}", userId, e.getMessage());
        }
        return 1000;
    }

    @SuppressWarnings("unchecked")
    private int fetchUserTotalChallenges(Long userId) {
        try {
            Map<String, Object> profile = restTemplate.getForObject(
                    authServiceUrl + "/api/auth/users/" + userId + "/profile", Map.class);
            if (profile != null && profile.get("totalChallengesCompleted") != null) {
                return ((Number) profile.get("totalChallengesCompleted")).intValue();
            }
        } catch (Exception e) {
            log.warn("Could not fetch user {} challenges count: {}", userId, e.getMessage());
        }
        return 0;
    }

    @Override
    public SubmissionDTO getSubmissionById(Long id, Long userId, boolean isAdmin, boolean isTeacher) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found with id: " + id));

        if (!canAccessSubmission(submission, userId, isAdmin, isTeacher)) {
            throw new SecurityException("You are not allowed to access this submission");
        }

        return buildSubmissionDto(submission, userId, isAdmin, isTeacher);
    }

    @Override
    public LogsResponse getLogs(Long id, Long userId, boolean isAdmin, boolean isTeacher) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found with id: " + id));

        if (!canAccessSubmission(submission, userId, isAdmin, isTeacher)) {
            throw new SecurityException("You are not allowed to access this submission");
        }

        return new LogsResponse(submission.getBuildLogs(), submission.getTestLogs());
    }

    @Override
    public ReplayTimelineResponse getReplayTimeline(Long id, Long userId, boolean isAdmin, boolean isTeacher) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found with id: " + id));
        if (!canAccessSubmission(submission, userId, isAdmin, isTeacher)) {
            throw new SecurityException("You are not allowed to access this submission");
        }
        List<ReplayEvent> events = replayEventRepository.findBySubmissionIdOrderByOccurredAtAscIdAsc(id);
        if (!events.isEmpty()) {
            return new ReplayTimelineResponse("structured",
                    events.stream().map(ReplayEventDTO::fromEntity).toList());
        }
        if (replayMongoArchiveService != null) {
            Optional<List<ReplayEventDTO>> fromMongo = replayMongoArchiveService.findTimeline(id);
            if (fromMongo.isPresent() && !fromMongo.get().isEmpty()) {
                return new ReplayTimelineResponse("structured+mongo", fromMongo.get());
            }
        }
        if ("logs".equalsIgnoreCase(replaySource)) {
            List<ReplayEventDTO> synthetic = new ArrayList<>();
            synthetic.add(new ReplayEventDTO(null, "FALLBACK", "LOG_ONLY", "warn",
                    "Structured replay not available; using logs fallback", null, LocalDateTime.now()));
            return new ReplayTimelineResponse("logs", synthetic);
        }
        return new ReplayTimelineResponse("structured", List.of());
    }

    @Override
    public List<SubmissionSummaryDTO> getMySubmissions(Long userId) {
        List<Submission> submissions = submissionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        Set<Long> challengeIds = submissions.stream()
                .map(Submission::getChallengeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> titleByChallengeId = new HashMap<>();
        for (Long cid : challengeIds) {
            Map<String, Object> ch = fetchChallengeData(cid);
            if (ch != null && ch.get("title") != null) {
                titleByChallengeId.put(cid, Objects.toString(ch.get("title")));
            }
        }
        return submissions.stream()
                .map(s -> SubmissionSummaryDTO.fromEntity(s, titleByChallengeId.get(s.getChallengeId()),
                        zipDownloadExpiresAtIso(s)))
                .toList();
    }

    @Override
    public List<SubmissionSummaryDTO> getTeacherStudentSubmissions(Long teacherId, Long studentId) {
        if (teacherId == null) {
            throw new IllegalArgumentException("Teacher ID is required");
        }
        if (studentId == null) {
            throw new IllegalArgumentException("Student ID is required");
        }

        List<Submission> submissions = submissionRepository.findByUserIdOrderByCreatedAtDesc(studentId);
        Map<Long, Map<String, Object>> challengeCache = new HashMap<>();

        List<SubmissionSummaryDTO> result = new ArrayList<>();
        for (Submission submission : submissions) {
            Map<String, Object> challengeData = fetchChallengeDataCached(submission.getChallengeId(), challengeCache);
            if (!isTeacherOwnerOfChallenge(teacherId, challengeData)) {
                continue;
            }
            String title = challengeData.get("title") != null ? Objects.toString(challengeData.get("title")) : null;
            result.add(toTeacherSubmissionSummary(submission, title, null));
        }
        return result;
    }

    @Override
    public List<SubmissionSummaryDTO> getTeacherChallengeSubmissions(Long teacherId, Long challengeId) {
        if (teacherId == null) {
            throw new IllegalArgumentException("Teacher ID is required");
        }
        if (challengeId == null) {
            throw new IllegalArgumentException("Challenge ID is required");
        }
        Map<String, Object> challengeData = fetchChallengeData(challengeId);
        if (!isTeacherOwnerOfChallenge(teacherId, challengeData)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this challenge");
        }
        String title = challengeData.get("title") != null ? Objects.toString(challengeData.get("title")) : null;
        List<Submission> submissions = submissionRepository.findByChallengeIdOrderByCreatedAtDesc(challengeId);
        Map<Long, String> usernameCache = new HashMap<>();
        List<SubmissionSummaryDTO> result = new ArrayList<>(submissions.size());
        for (Submission submission : submissions) {
            Long uid = submission.getUserId();
            String username = uid != null ? usernameCache.computeIfAbsent(uid, this::fetchUsername) : null;
            result.add(toTeacherSubmissionSummary(submission, title, username));
        }
        return result;
    }

    @Override
    public List<SubmissionSummaryDTO> getTeacherCorrectionsQueue(Long teacherId, String authorizationHeader, int limit) {
        if (teacherId == null) {
            throw new IllegalArgumentException("Teacher ID is required");
        }
        int cap = Math.min(Math.max(limit, 1), 200);
        List<Map<String, Object>> mine = fetchMyChallengesAsMaps(authorizationHeader);
        if (mine.isEmpty()) {
            return List.of();
        }
        List<Long> challengeIds = mine.stream()
                .map(m -> asLong(m.get("id")))
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (challengeIds.isEmpty()) {
            return List.of();
        }
        Map<Long, String> titleByChallengeId = new HashMap<>();
        for (Map<String, Object> m : mine) {
            Long id = asLong(m.get("id"));
            if (id == null) {
                continue;
            }
            Object t = m.get("title");
            if (t != null) {
                titleByChallengeId.put(id, Objects.toString(t));
            }
        }
        List<Submission> rows = submissionRepository.findByChallengeIdInAndStatusOrderByCompletedAtDescIdDesc(
                challengeIds, Submission.Status.COMPLETED, PageRequest.of(0, cap));
        Map<Long, String> usernameCache = new HashMap<>();
        List<SubmissionSummaryDTO> out = new ArrayList<>(rows.size());
        for (Submission submission : rows) {
            String title = titleByChallengeId.get(submission.getChallengeId());
            if (title == null) {
                Map<String, Object> ch = fetchChallengeData(submission.getChallengeId());
                title = ch != null && ch.get("title") != null ? Objects.toString(ch.get("title")) : null;
            }
            Long uid = submission.getUserId();
            String username = uid != null ? usernameCache.computeIfAbsent(uid, this::fetchUsername) : null;
            out.add(toTeacherSubmissionSummary(submission, title, username));
        }
        return out;
    }

    private SubmissionSummaryDTO toTeacherSubmissionSummary(Submission submission, String challengeTitle,
            String submitterUsername) {
        SubmissionSummaryDTO dto = SubmissionSummaryDTO.fromEntity(
                submission, challengeTitle, zipDownloadExpiresAtIso(submission), submitterUsername);
        dto.setTeacherCorrectionComplete(computeTeacherCorrectionComplete(submission));
        return dto;
    }

    private boolean computeTeacherCorrectionComplete(Submission s) {
        if (Boolean.TRUE.equals(s.getTeacherManualGrading())) {
            return true;
        }
        if (s.getTeacherPenalties() != null && !s.getTeacherPenalties().isEmpty()) {
            return true;
        }
        if (s.getTeacherPersonalNote() != null && !s.getTeacherPersonalNote().isBlank()) {
            return true;
        }
        if (s.getTeacherZoneNotes() != null) {
            for (String v : s.getTeacherZoneNotes().values()) {
                if (v != null && !v.isBlank()) {
                    return true;
                }
            }
        }
        if (hasMeaningfulStructuredTeacherFeedback(s.getTeacherStructuredFeedback())) {
            return true;
        }
        if (s.getTeacherScoreBonuses() != null && !s.getTeacherScoreBonuses().isEmpty()) {
            return true;
        }
        return false;
    }

    private boolean hasMeaningfulStructuredTeacherFeedback(Map<String, Object> raw) {
        if (raw == null || raw.isEmpty()) {
            return false;
        }
        Object summary = raw.get("summary");
        if (summary instanceof String s && !s.isBlank()) {
            return true;
        }
        Object strengths = raw.get("strengths");
        if (strengths instanceof List<?> list && !list.isEmpty()) {
            return true;
        }
        Object suggestions = raw.get("suggestions");
        if (suggestions instanceof List<?> list2 && !list2.isEmpty()) {
            return true;
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchMyChallengesAsMaps(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
            log.warn("Missing Bearer token for teacher corrections queue");
            return List.of();
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.AUTHORIZATION, authorizationHeader.trim());
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    challengeServiceUrl + "/api/challenges/mine?includeInactive=true",
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {});
            List<Map<String, Object>> body = response.getBody();
            return body != null ? body : List.of();
        } catch (Exception e) {
            log.warn("Could not list teacher challenges for corrections queue: {}", e.getMessage());
            return List.of();
        }
    }

    @Override
    public Map<Long, Long> getTeacherStudentsSubmissionCounts(Long teacherId, List<Long> studentIds) {
        if (teacherId == null) {
            throw new IllegalArgumentException("Teacher ID is required");
        }
        if (studentIds == null || studentIds.isEmpty()) {
            return Map.of();
        }

        List<Long> normalizedStudentIds = studentIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (normalizedStudentIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, Long> counts = new LinkedHashMap<>();
        for (Long studentId : normalizedStudentIds) {
            counts.put(studentId, 0L);
        }

        List<Submission> submissions = submissionRepository.findByUserIdInOrderByCreatedAtDesc(normalizedStudentIds);
        Map<Long, Map<String, Object>> challengeCache = new HashMap<>();
        for (Submission submission : submissions) {
            if (!counts.containsKey(submission.getUserId())) {
                continue;
            }
            Map<String, Object> challengeData = fetchChallengeDataCached(submission.getChallengeId(), challengeCache);
            if (!isTeacherOwnerOfChallenge(teacherId, challengeData)) {
                continue;
            }
            counts.computeIfPresent(submission.getUserId(), (key, value) -> value + 1);
        }
        return counts;
    }

    @Override
    public SubmissionZipDownload prepareZipDownload(Long id, Long userId, boolean isAdmin, boolean isTeacher) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found with id: " + id));

        if (!canAccessSubmission(submission, userId, isAdmin, isTeacher)) {
            throw new SecurityException("You are not allowed to download this submission");
        }

        if (submission.getZipFilePath() == null || submission.getZipFilePath().isBlank()) {
            throw new IllegalArgumentException("Submission ZIP path is not available");
        }

        Path zipPath = uploadStorageService.getZipPath(submission.getZipFilePath()).toAbsolutePath().normalize();
        if (!Files.exists(zipPath)) {
            throw new IllegalArgumentException("Submission ZIP file not found");
        }
        return new SubmissionZipDownload(zipPath, zipDownloadExpiresAtIso(submission));
    }

    private String zipDownloadExpiresAtIso(Submission submission) {
        if (submission.getZipFilePath() == null || submission.getZipFilePath().isBlank()) {
            return null;
        }
        if (submission.getCreatedAt() == null) {
            return null;
        }
        int days = Math.max(1, zipAvailabilityDays);
        return submission.getCreatedAt()
                .plusDays(days)
                .atZone(ZoneId.of("UTC"))
                .toInstant()
                .toString();
    }

    @Override
    @Transactional
    public void deleteSubmission(Long id, Long userId, boolean isAdmin, boolean isTeacher) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found with id: " + id));

        if (!canAccessSubmission(submission, userId, isAdmin, isTeacher)) {
            throw new SecurityException("You are not allowed to delete this submission");
        }

        statusCacheService.evictStatus(id);
        if (replayMongoArchiveService != null) {
            replayMongoArchiveService.deleteBySubmissionId(id);
        }
        submissionRepository.delete(submission);
    }

    @Override
    public void updateStatus(Long submissionId, Submission.Status status, String errorMessage) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found with id: " + submissionId));

        submission.setStatus(status);
        submission.setErrorMessage(errorMessage);

        if (status == Submission.Status.COMPLETED || status == Submission.Status.FAILED) {
            submission.setCompletedAt(LocalDateTime.now());
        }
        submissionRepository.save(submission);

        statusCacheService.cacheStatus(submission);
        webSocketService.sendStatusUpdate(submissionId, SubmissionStatusCacheDTO.fromEntity(submission));
    }

    @Override
    public void appendBuildLogs(Long submissionId, String logs) {
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) return;

        String existing = submission.getBuildLogs() != null ? submission.getBuildLogs() : "";
        submission.setBuildLogs(existing + logs);
        submissionRepository.save(submission);

        webSocketService.sendLogAppend(submissionId, "build", logs, "info");
    }

    @Override
    public void appendTestLogs(Long submissionId, String logs) {
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) return;

        String existing = submission.getTestLogs() != null ? submission.getTestLogs() : "";
        submission.setTestLogs(existing + logs);
        submissionRepository.save(submission);

        webSocketService.sendLogAppend(submissionId, "test", logs, "info");
    }

    @Override
    public void updateScores(Long submissionId, BigDecimal totalScore,
                            BigDecimal correctnessScore, BigDecimal performanceScore,
                            BigDecimal designScore) {
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) return;

        submission.setTotalScore(totalScore != null ? totalScore : submission.getTotalScore());
        submission.setCorrectnessScore(correctnessScore != null ? correctnessScore : submission.getCorrectnessScore());
        submission.setPerformanceScore(performanceScore != null ? performanceScore : submission.getPerformanceScore());
        submission.setDesignScore(designScore != null ? designScore : submission.getDesignScore());
        submission.setStatus(Submission.Status.COMPLETED);
        submission.setCompletedAt(LocalDateTime.now());
        submissionRepository.save(submission);

        statusCacheService.cacheStatus(submission);
        webSocketService.sendCompleted(submissionId, SubmissionStatusCacheDTO.fromEntity(submission));
    }

    private Map<String, Object> fetchChallengeDataCached(Long challengeId, Map<Long, Map<String, Object>> cache) {
        if (challengeId == null) {
            return Map.of();
        }
        return cache.computeIfAbsent(challengeId, this::fetchChallengeData);
    }

    private boolean isTeacherOwnerOfChallenge(Long teacherId, Map<String, Object> challengeData) {
        if (teacherId == null || challengeData == null || challengeData.isEmpty()) {
            return false;
        }
        Long createdBy = asLong(challengeData.get("createdBy"));
        return createdBy != null && teacherId.equals(createdBy);
    }

    private boolean canAccessSubmission(Submission submission, Long userId, boolean isAdmin, boolean isTeacher) {
        if (submission == null) {
            return false;
        }
        if (isAdmin) {
            return true;
        }
        if (submission.getUserId() != null && submission.getUserId().equals(userId)) {
            return true;
        }
        if (isTeacher && userId != null) {
            Map<String, Object> challengeData = fetchChallengeData(submission.getChallengeId());
            return isTeacherOwnerOfChallenge(userId, challengeData);
        }
        return false;
    }

    private SubmissionDTO buildSubmissionDto(Submission submission, Long viewerId, boolean isAdmin, boolean isTeacher) {
        String wsTopic = webSocketService.getWsTopicForSubmission(submission.getId());
        SubmissionDTO dto = SubmissionDTO.fromEntity(submission, wsTopic);
        enrichTeacherGradingFlags(submission, dto, viewerId, isTeacher);
        return dto;
    }

    private void enrichTeacherGradingFlags(Submission submission, SubmissionDTO dto, Long viewerId, boolean isTeacher) {
        dto.setTeacherCanApplyPenalty(false);
        dto.setTeacherCanManualGrade(false);
        dto.setTeacherCanEditSubmissionReview(false);
        if (!isTeacher || viewerId == null) {
            return;
        }
        if (submission.getStatus() != Submission.Status.COMPLETED) {
            return;
        }
        if (submission.getUserId() != null && submission.getUserId().equals(viewerId)) {
            return;
        }
        Map<String, Object> ch = fetchChallengeData(submission.getChallengeId());
        if (!isTeacherOwnerOfChallenge(viewerId, ch)) {
            return;
        }
        dto.setTeacherCanApplyPenalty(true);
        if (fetchStudentInTeacherGroup(viewerId, submission.getUserId())) {
            dto.setTeacherCanManualGrade(true);
        }
        dto.setTeacherCanEditSubmissionReview(Boolean.TRUE.equals(dto.getTeacherCanApplyPenalty())
                || Boolean.TRUE.equals(dto.getTeacherCanManualGrade()));
    }

    private boolean fetchStudentInTeacherGroup(Long teacherId, Long studentUserId) {
        if (internalToken == null || internalToken.isBlank()) {
            return false;
        }
        if (teacherId == null || studentUserId == null) {
            return false;
        }
        try {
            String url = authServiceUrl + "/internal/teachers/" + teacherId + "/students/" + studentUserId + "/in-group";
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Internal-Token", internalToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            var resp = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<?, ?> body = resp.getBody();
            if (body == null) {
                return false;
            }
            Object v = body.get("inGroup");
            return Boolean.TRUE.equals(v) || "true".equalsIgnoreCase(String.valueOf(v));
        } catch (Exception e) {
            log.warn("Could not verify teacher group membership: {}", e.getMessage());
            return false;
        }
    }

    @Override
    @Transactional
    public SubmissionDTO saveTeacherSubmissionReview(Long submissionId, Long teacherId,
            TeacherSubmissionReviewRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Body is required");
        }
        Submission submission = loadSubmissionForTeacherPenalty(submissionId, teacherId);

        BigDecimal oldBonusSum = sumTeacherBonusPointsJson(submission.getTeacherScoreBonuses());
        List<Map<String, Object>> newBonusRows = buildTeacherBonusRowsFromRequest(teacherId, request.getBonuses());
        BigDecimal newBonusSum = sumTeacherBonusPointsJson(newBonusRows);
        BigDecimal delta = newBonusSum.subtract(oldBonusSum).setScale(2, RoundingMode.HALF_UP);
        BigDecimal candidateTotal = nz(submission.getTotalScore()).add(delta);
        if (candidateTotal.compareTo(MAX_TOTAL_SCORE) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Total score after bonus adjustment cannot exceed 1000. Reduce bonus points or remove lines.");
        }
        BigDecimal newTotal = candidateTotal.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        if (Boolean.TRUE.equals(submission.getTeacherManualGrading())) {
            scaleComponentScoresToTotal(submission, newTotal);
        } else {
            submission.setTotalScore(newTotal);
        }
        submission.setTeacherScoreBonuses(newBonusRows);

        String note = request.getPersonalNote() != null ? request.getPersonalNote().trim() : "";
        submission.setTeacherPersonalNote(note.isBlank() ? null : note);

        Map<String, String> zn = sanitizeTeacherZoneNotes(request.getZoneNotes());
        submission.setTeacherZoneNotes(zn.isEmpty() ? new HashMap<>() : zn);

        Map<String, Object> sf = sanitizeTeacherStructuredFeedback(request.getStructuredFeedback());
        submission.setTeacherStructuredFeedback(sf == null || sf.isEmpty() ? null : sf);

        submissionRepository.save(submission);
        statusCacheService.cacheStatus(submission);
        webSocketService.sendCompleted(submissionId, SubmissionStatusCacheDTO.fromEntity(submission));

        boolean notify = request.getNotifyStudent() == null || Boolean.TRUE.equals(request.getNotifyStudent());
        if (notify) {
            try {
                pushTeacherReviewNotification(submission);
            } catch (Exception e) {
                log.warn("Could not notify student about teacher review: {}", e.getMessage());
            }
        }
        return buildSubmissionDto(submission, teacherId, false, true);
    }

    private void pushTeacherReviewNotification(Submission submission) {
        String base = notificationServiceUrl != null ? notificationServiceUrl.trim() : "";
        if (base.isEmpty()) {
            return;
        }
        Map<String, Object> ch = fetchChallengeData(submission.getChallengeId());
        String challengeTitle = ch != null && ch.get("title") != null ? Objects.toString(ch.get("title")) : "";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("userId", submission.getUserId());
        body.put("submissionId", submission.getId());
        body.put("challengeId", submission.getChallengeId());
        body.put("challengeTitle", challengeTitle);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        restTemplate.postForEntity(
                base + "/internal/notifications/teacher-submission-review",
                new HttpEntity<>(body, headers),
                Void.class);
    }

    private static List<Map<String, Object>> buildTeacherBonusRowsFromRequest(Long teacherId,
            List<TeacherBonusLineRequest> lines) {
        if (lines == null || lines.isEmpty()) {
            return new ArrayList<>();
        }
        String now = Instant.now().toString();
        List<Map<String, Object>> out = new ArrayList<>();
        for (TeacherBonusLineRequest line : lines) {
            if (line == null || line.getPoints() == null) {
                continue;
            }
            BigDecimal pts = line.getPoints().setScale(2, RoundingMode.HALF_UP);
            if (pts.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            String id = line.getId() != null && !line.getId().isBlank()
                    ? line.getId().trim()
                    : UUID.randomUUID().toString();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", id);
            row.put("pointsAdded", pts);
            if (line.getLabel() != null && !line.getLabel().isBlank()) {
                row.put("label", line.getLabel().trim());
            }
            if (line.getNote() != null && !line.getNote().isBlank()) {
                row.put("note", line.getNote().trim());
            }
            row.put("teacherId", teacherId);
            row.put("updatedAt", now);
            out.add(row);
        }
        return out;
    }

    private static BigDecimal sumTeacherBonusPointsJson(List<Map<String, Object>> rows) {
        if (rows == null || rows.isEmpty()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal sum = BigDecimal.ZERO;
        for (Map<String, Object> row : rows) {
            if (row == null) {
                continue;
            }
            sum = sum.add(toBigDecimal(row.get("pointsAdded")));
        }
        return sum.setScale(2, RoundingMode.HALF_UP);
    }

    private static final Set<String> TEACHER_ZONE_KEYS = Set.of("correctness", "performance", "design", "aiReview");

    private static String normalizeTeacherZoneKey(String rawKey) {
        if (rawKey == null) {
            return null;
        }
        String k = rawKey.trim();
        if ("aireview".equalsIgnoreCase(k) || "ai_review".equalsIgnoreCase(k)) {
            return "aiReview";
        }
        for (String canonical : TEACHER_ZONE_KEYS) {
            if (canonical.equalsIgnoreCase(k)) {
                return canonical;
            }
        }
        return null;
    }

    private static Map<String, String> sanitizeTeacherZoneNotes(Map<String, String> raw) {
        if (raw == null || raw.isEmpty()) {
            return new HashMap<>();
        }
        Map<String, String> out = new HashMap<>();
        for (Map.Entry<String, String> e : raw.entrySet()) {
            String canonical = normalizeTeacherZoneKey(e.getKey());
            if (canonical == null) {
                continue;
            }
            String v = e.getValue() == null ? "" : e.getValue().trim();
            if (v.length() > 4000) {
                v = v.substring(0, 4000);
            }
            if (!v.isBlank()) {
                out.put(canonical, v);
            }
        }
        return out;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> sanitizeTeacherStructuredFeedback(Map<String, Object> raw) {
        if (raw == null || raw.isEmpty()) {
            return null;
        }
        Map<String, Object> out = new LinkedHashMap<>();
        Object summary = raw.get("summary");
        if (summary instanceof String s && !s.isBlank()) {
            String t = s.trim();
            if (t.length() > 4000) {
                t = t.substring(0, 4000);
            }
            out.put("summary", t);
        }
        List<String> strengths = normalizeTeacherFeedbackLines(raw.get("strengths"));
        List<String> suggestions = normalizeTeacherFeedbackLines(raw.get("suggestions"));
        if (!strengths.isEmpty()) {
            out.put("strengths", strengths);
        }
        if (!suggestions.isEmpty()) {
            out.put("suggestions", suggestions);
        }
        if (out.isEmpty()) {
            return null;
        }
        return out;
    }

    private static List<String> normalizeTeacherFeedbackLines(Object raw) {
        List<String> out = new ArrayList<>();
        if (raw == null) {
            return out;
        }
        if (raw instanceof String s) {
            for (String line : s.split("\\r?\\n")) {
                String t = line.trim();
                if (t.length() > 400) {
                    t = t.substring(0, 400);
                }
                if (!t.isBlank()) {
                    out.add(t);
                }
                if (out.size() >= 30) {
                    break;
                }
            }
            return out;
        }
        if (raw instanceof List<?> list) {
            for (Object o : list) {
                if (o == null) {
                    continue;
                }
                String t = String.valueOf(o).trim();
                if (t.length() > 400) {
                    t = t.substring(0, 400);
                }
                if (!t.isBlank()) {
                    out.add(t);
                }
                if (out.size() >= 30) {
                    break;
                }
            }
        }
        return out;
    }

    @Override
    @Transactional
    public SubmissionDTO applyTeacherPenalty(Long submissionId, Long teacherId, TeacherPenaltyApplyRequest request) {
        if (teacherId == null) {
            throw new IllegalArgumentException("Teacher ID is required");
        }
        if (request == null || request.getPresetKey() == null || request.getPresetKey().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "presetKey is required");
        }
        Submission submission = loadSubmissionForTeacherPenalty(submissionId, teacherId);
        Instant confirmedAt = Instant.now();
        appendPenaltyEntries(submission, teacherId, List.of(request), confirmedAt);
        persistAfterTeacherPenaltyChange(submissionId, submission);
        return buildSubmissionDto(submission, teacherId, false, true);
    }

    @Override
    @Transactional
    public SubmissionDTO confirmTeacherPenalties(Long submissionId, Long teacherId,
            TeacherPenaltiesBatchConfirmRequest request) {
        if (teacherId == null) {
            throw new IllegalArgumentException("Teacher ID is required");
        }
        if (request == null || request.getPenalties() == null || request.getPenalties().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "penalties must not be empty");
        }
        Submission submission = loadSubmissionForTeacherPenalty(submissionId, teacherId);
        Instant confirmedAt = Instant.now();
        appendPenaltyEntries(submission, teacherId, request.getPenalties(), confirmedAt);
        persistAfterTeacherPenaltyChange(submissionId, submission);
        return buildSubmissionDto(submission, teacherId, false, true);
    }

    @Override
    @Transactional
    public SubmissionDTO revokeTeacherPenalty(Long submissionId, Long teacherId, String penaltyId) {
        if (teacherId == null) {
            throw new IllegalArgumentException("Teacher ID is required");
        }
        if (penaltyId == null || penaltyId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "penaltyId is required");
        }
        Submission submission = loadSubmissionForTeacherPenalty(submissionId, teacherId);
        List<Map<String, Object>> penalties = submission.getTeacherPenalties();
        if (penalties == null || penalties.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No penalties on this submission");
        }
        List<Map<String, Object>> copy = new ArrayList<>(penalties);
        int idx = -1;
        for (int i = 0; i < copy.size(); i++) {
            Object idObj = copy.get(i).get("id");
            if (idObj != null && penaltyId.equals(String.valueOf(idObj))) {
                idx = i;
                break;
            }
        }
        if (idx < 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Penalty not found or cannot be removed (legacy entries without id are locked)");
        }
        Map<String, Object> removed = copy.get(idx);
        Long entryTeacherId = asLong(removed.get("teacherId"));
        if (entryTeacherId == null || !entryTeacherId.equals(teacherId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only remove penalties you applied");
        }
        Instant start = parsePenaltyRevocationClockStart(removed);
        if (start.plus(TEACHER_PENALTY_REVOCATION_WINDOW).isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.GONE,
                    "Penalty can no longer be removed (allowed for " + TEACHER_PENALTY_REVOCATION_WINDOW.toHours() + " hours after confirmation)");
        }
        BigDecimal pointsBack = toBigDecimal(removed.get("pointsDeducted"));
        copy.remove(idx);
        submission.setTeacherPenalties(copy);
        BigDecimal newTotal = nz(submission.getTotalScore()).add(pointsBack).min(MAX_TOTAL_SCORE)
                .setScale(2, RoundingMode.HALF_UP);
        if (Boolean.TRUE.equals(submission.getTeacherManualGrading())) {
            scaleComponentScoresToTotal(submission, newTotal);
        } else {
            submission.setTotalScore(newTotal);
        }
        persistAfterTeacherPenaltyChange(submissionId, submission);
        return buildSubmissionDto(submission, teacherId, false, true);
    }

    private Submission loadSubmissionForTeacherPenalty(Long submissionId, Long teacherId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found with id: " + submissionId));
        if (submission.getStatus() != Submission.Status.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Penalty applies only to completed submissions");
        }
        if (submission.getUserId() != null && submission.getUserId().equals(teacherId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot apply penalty to your own submission");
        }
        Map<String, Object> ch = fetchChallengeData(submission.getChallengeId());
        if (!isTeacherOwnerOfChallenge(teacherId, ch)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this challenge");
        }
        return submission;
    }

    private void appendPenaltyEntries(Submission submission, Long teacherId, List<TeacherPenaltyApplyRequest> requests,
            Instant confirmedAt) {
        String atIso = confirmedAt.toString();
        List<Map<String, Object>> penalties = submission.getTeacherPenalties() == null
                ? new ArrayList<>()
                : new ArrayList<>(submission.getTeacherPenalties());
        BigDecimal runningTotal = nz(submission.getTotalScore());
        for (TeacherPenaltyApplyRequest request : requests) {
            if (request == null || request.getPresetKey() == null || request.getPresetKey().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "presetKey is required for each penalty");
            }
            String presetKey = request.getPresetKey().trim().toUpperCase();
            BigDecimal requestedPenalty;
            String label;
            if ("OTHER".equals(presetKey)) {
                if (request.getPenaltyPoints() == null || request.getPenaltyPoints().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "penaltyPoints is required for OTHER");
                }
                if (request.getCustomDescription() == null || request.getCustomDescription().isBlank()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "customDescription is required for OTHER");
                }
                requestedPenalty = request.getPenaltyPoints().min(MAX_SINGLE_PENALTY).setScale(2, RoundingMode.HALF_UP);
                label = TEACHER_PRESET_LABELS.getOrDefault("OTHER", "Other (custom)");
            } else {
                if (!TEACHER_PRESET_PENALTIES.containsKey(presetKey)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown presetKey: " + presetKey);
                }
                requestedPenalty = TEACHER_PRESET_PENALTIES.get(presetKey);
                label = TEACHER_PRESET_LABELS.getOrDefault(presetKey, presetKey);
            }
            BigDecimal applied = requestedPenalty.min(runningTotal).max(BigDecimal.ZERO);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", UUID.randomUUID().toString());
            entry.put("confirmedAt", atIso);
            entry.put("presetKey", presetKey);
            entry.put("label", label);
            entry.put("pointsDeducted", applied);
            entry.put("requestedPenalty", requestedPenalty);
            if (request.getCustomNote() != null && !request.getCustomNote().isBlank()) {
                entry.put("note", request.getCustomNote().trim());
            }
            if ("OTHER".equals(presetKey)) {
                entry.put("customDescription", request.getCustomDescription().trim());
            }
            entry.put("teacherId", teacherId);
            entry.put("appliedAt", atIso);
            penalties.add(entry);
            runningTotal = runningTotal.subtract(applied).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        }
        submission.setTeacherPenalties(penalties);
        if (Boolean.TRUE.equals(submission.getTeacherManualGrading())) {
            scaleComponentScoresToTotal(submission, runningTotal);
        } else {
            submission.setTotalScore(runningTotal);
        }
    }

    private void persistAfterTeacherPenaltyChange(Long submissionId, Submission submission) {
        submissionRepository.save(submission);
        statusCacheService.cacheStatus(submission);
        webSocketService.sendCompleted(submissionId, SubmissionStatusCacheDTO.fromEntity(submission));
    }

    private static Instant parsePenaltyRevocationClockStart(Map<String, Object> entry) {
        Object confirmed = entry.get("confirmedAt");
        if (confirmed instanceof String s && !s.isBlank()) {
            return Instant.parse(s);
        }
        Object applied = entry.get("appliedAt");
        if (applied instanceof String s && !s.isBlank()) {
            return Instant.parse(s);
        }
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Penalty entry has no confirmation timestamp");
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal b) {
            return b;
        }
        if (value instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue()).setScale(2, RoundingMode.HALF_UP);
        }
        try {
            return new BigDecimal(String.valueOf(value)).setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    @Override
    @Transactional
    public SubmissionDTO applyTeacherManualScores(Long submissionId, Long teacherId, TeacherManualScoresRequest request) {
        if (teacherId == null) {
            throw new IllegalArgumentException("Teacher ID is required");
        }
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Body is required");
        }
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found with id: " + submissionId));
        if (submission.getStatus() != Submission.Status.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Manual grading applies only to completed submissions");
        }
        if (submission.getUserId() != null && submission.getUserId().equals(teacherId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot grade your own submission");
        }
        Map<String, Object> ch = fetchChallengeData(submission.getChallengeId());
        if (!isTeacherOwnerOfChallenge(teacherId, ch)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this challenge");
        }
        if (!fetchStudentInTeacherGroup(teacherId, submission.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Manual grading is only available for students in your groups");
        }

        BigDecimal c = requireBoundedScore(request.getCorrectnessScore(), "correctnessScore", new BigDecimal("300"));
        BigDecimal p = requireBoundedScore(request.getPerformanceScore(), "performanceScore", new BigDecimal("300"));
        BigDecimal d = requireBoundedScore(request.getDesignScore(), "designScore", new BigDecimal("200"));
        BigDecimal a = requireBoundedScore(request.getAiReviewScore(), "aiReviewScore", new BigDecimal("200"));

        BigDecimal total = c.add(p).add(d).add(a).setScale(2, RoundingMode.HALF_UP);
        if (total.compareTo(new BigDecimal("1000")) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sum of scores cannot exceed 1000");
        }

        submission.setCorrectnessScore(c);
        submission.setPerformanceScore(p);
        submission.setDesignScore(d);
        submission.setAiReviewScore(a);
        submission.setTotalScore(total);
        submission.setTeacherManualGrading(true);

        submissionRepository.save(submission);
        statusCacheService.cacheStatus(submission);
        webSocketService.sendCompleted(submissionId, SubmissionStatusCacheDTO.fromEntity(submission));

        return buildSubmissionDto(submission, teacherId, false, true);
    }

    private static BigDecimal requireBoundedScore(BigDecimal v, String name, BigDecimal max) {
        if (v == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, name + " is required");
        }
        if (v.compareTo(BigDecimal.ZERO) < 0 || v.compareTo(max) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, name + " must be between 0 and " + max);
        }
        return v.setScale(2, RoundingMode.HALF_UP);
    }

    private static void scaleComponentScoresToTotal(Submission submission, BigDecimal targetTotal) {
        BigDecimal c = nz(submission.getCorrectnessScore());
        BigDecimal p = nz(submission.getPerformanceScore());
        BigDecimal d = nz(submission.getDesignScore());
        BigDecimal a = nz(submission.getAiReviewScore());
        BigDecimal sum = c.add(p).add(d).add(a);
        if (sum.compareTo(BigDecimal.ZERO) <= 0) {
            submission.setTotalScore(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            return;
        }
        BigDecimal ratio = targetTotal.divide(sum, 8, RoundingMode.HALF_UP);
        submission.setCorrectnessScore(c.multiply(ratio).setScale(2, RoundingMode.HALF_UP));
        submission.setPerformanceScore(p.multiply(ratio).setScale(2, RoundingMode.HALF_UP));
        submission.setDesignScore(d.multiply(ratio).setScale(2, RoundingMode.HALF_UP));
        submission.setAiReviewScore(a.multiply(ratio).setScale(2, RoundingMode.HALF_UP));
        submission.setTotalScore(targetTotal.setScale(2, RoundingMode.HALF_UP));
    }

    private static BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private Long asLong(Object value) {
        if (value instanceof Number n) {
            return n.longValue();
        }
        if (value instanceof String s) {
            try {
                return Long.parseLong(s);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }
}
