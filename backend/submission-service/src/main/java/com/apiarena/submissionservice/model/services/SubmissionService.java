package com.apiarena.submissionservice.model.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
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
import com.apiarena.submissionservice.model.dto.SubmissionDTO;
import com.apiarena.submissionservice.model.dto.SubmissionStatusCacheDTO;
import com.apiarena.submissionservice.kafka.SubmissionCompletedEvent;
import com.apiarena.submissionservice.kafka.SubmissionKafkaPublisher;
import com.apiarena.submissionservice.model.dto.SubmissionSummaryDTO;
import com.apiarena.submissionservice.model.entities.Submission;
import com.apiarena.submissionservice.repository.SubmissionRepository;

@Service
public class SubmissionService implements ISubmissionService {

    private static final Logger log = LoggerFactory.getLogger(SubmissionService.class);

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

    @Value("${services.auth-url:http://localhost:8081}")
    private String authServiceUrl;

    @Value("${services.challenge-url:http://localhost:8082}")
    private String challengeServiceUrl;

    @Value("${services.sandbox-url:http://localhost:8084}")
    private String sandboxServiceUrl;

    @Value("${services.testing-url:http://localhost:8085}")
    private String testingServiceUrl;

    @Value("${services.candidate-host:localhost}")
    private String candidateApiHost;

    @Value("${apiarena.submission.max-attempts-per-day-per-challenge:3}")
    private int maxAttemptsPerDayPerChallenge;

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

    @Override
    @Transactional
    public CreateSubmissionResponse createSubmission(Long challengeId, Long userId, MultipartFile zipFile,
            boolean rateLimitBypass) {

        if (challengeId == null) {
            throw new IllegalArgumentException("Challenge ID is required");
        }
        if (userId == null) {
            throw new IllegalArgumentException("User must be authenticated");
        }

        assertChallengeSubmissionAllowed(userId, challengeId, rateLimitBypass);

        Submission submission = Submission.builder()
                .challengeId(challengeId)
                .userId(userId)
                .status(Submission.Status.PENDING)
                .build();

        Submission saved = submissionRepository.save(submission);

        String zipFilePath = uploadStorageService.storeZip(zipFile, saved.getId());
        saved.setZipFilePath(zipFilePath);
        saved.setStatus(Submission.Status.PENDING);
        saved = submissionRepository.save(saved);

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
        try {
            Submission sub = submissionRepository.findById(submissionId).orElse(null);
            if (sub == null) {
                log.warn("runSubmissionPipeline: submission {} not found (possible race); skipping", submissionId);
                return;
            }

            updateStatus(submissionId, Submission.Status.BUILDING, null);

            Map<String, Object> buildReq = new HashMap<>();
            buildReq.put("submissionId", submissionId);
            buildReq.put("zipFilePath", sub.getZipFilePath());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> buildEntity = new HttpEntity<>(buildReq, headers);

            Map<String, Object> exec = restTemplate.postForObject(
                    sandboxServiceUrl + "/internal/sandbox/build", buildEntity, Map.class);

            if (exec == null) {
                updateStatus(submissionId, Submission.Status.FAILED, "Sandbox returned empty response");
                return;
            }

            Object bl = exec.get("buildLogs");
            if (bl != null) {
                appendBuildLogs(submissionId, bl.toString());
            }

            String sandboxStatus = Objects.toString(exec.get("status"), "");
            if ("FAILED".equals(sandboxStatus)) {
                String err = Objects.toString(exec.get("errorMessage"), "Sandbox build failed");
                updateStatus(submissionId, Submission.Status.FAILED, err);
                return;
            }

            Number portNum = (Number) exec.get("exposedPort");
            int port = portNum != null ? portNum.intValue() : 9100;
            String candidateUrl = String.format("http://%s:%d", candidateApiHost, port);

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
                updateStatus(submissionId, Submission.Status.FAILED, "Testing service returned empty response");
                return;
            }

            StringBuilder testLog = new StringBuilder();
            List<Map<String, Object>> results = (List<Map<String, Object>>) suite.get("results");
            if (results != null) {
                for (Map<String, Object> tr : results) {
                    String name = Objects.toString(tr.get("testName"), "?");
                    String st = Objects.toString(tr.get("status"), "?");
                    String ac = Objects.toString(tr.get("actualResult"), "");
                    testLog.append(String.format("[TEST] %s => %s %s%n", name, st, ac));
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

            BigDecimal totalBd = BigDecimal.valueOf(Math.min(1000, total)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal corrBd = BigDecimal.valueOf(corr).setScale(2, RoundingMode.HALF_UP);
            BigDecimal perfBd = BigDecimal.valueOf(perf).setScale(2, RoundingMode.HALF_UP);
            BigDecimal designBd = BigDecimal.valueOf(design).setScale(2, RoundingMode.HALF_UP);

            updateScores(submissionId, totalBd, corrBd, perfBd, designBd);
            applyMetricsFromResults(submissionId, results);

            calculateAndApplyRewards(submissionId);

        } catch (Exception e) {
            log.error("Submission pipeline failed for {}", submissionId, e);
            updateStatus(submissionId, Submission.Status.FAILED,
                    e.getMessage() != null ? e.getMessage() : "Pipeline failed");
        } finally {
            try {
                restTemplate.exchange(
                        sandboxServiceUrl + "/internal/sandbox/stop/" + submissionId,
                        HttpMethod.POST,
                        HttpEntity.EMPTY,
                        Map.class);
            } catch (Exception e) {
                log.warn("Sandbox stop after submission {}: {}", submissionId, e.getMessage());
            }
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

    private static final Map<String, Integer> DIFFICULTY_RATING = Map.of(
            "EASY", 800, "MEDIUM", 1200, "HARD", 1600, "EXPERT", 2000);
    private static final Map<String, Double> DIFFICULTY_ELO_MULTIPLIER = Map.of(
            "EASY", 0.0, "MEDIUM", 1.0, "HARD", 1.4, "EXPERT", 1.8);
    private static final int MIN_RANKED_CHALLENGES = 3;

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
    public SubmissionDTO getSubmissionById(Long id, Long userId, boolean isAdminOrTeacher) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found with id: " + id));

        if (!isAdminOrTeacher && !submission.getUserId().equals(userId)) {
            throw new SecurityException("You are not allowed to access this submission");
        }

        String wsTopic = webSocketService.getWsTopicForSubmission(id);
        return SubmissionDTO.fromEntity(submission, wsTopic);
    }

    @Override
    public LogsResponse getLogs(Long id, Long userId, boolean isAdminOrTeacher) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found with id: " + id));

        if (!isAdminOrTeacher && !submission.getUserId().equals(userId)) {
            throw new SecurityException("You are not allowed to access this submission");
        }

        return new LogsResponse(submission.getBuildLogs(), submission.getTestLogs());
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
                .map(s -> SubmissionSummaryDTO.fromEntity(s, titleByChallengeId.get(s.getChallengeId())))
                .toList();
    }

    @Override
    @Transactional
    public void deleteSubmission(Long id, Long userId, boolean isAdminOrTeacher) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found with id: " + id));

        if (!isAdminOrTeacher && !submission.getUserId().equals(userId)) {
            throw new SecurityException("You are not allowed to delete this submission");
        }

        statusCacheService.evictStatus(id);
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
}
