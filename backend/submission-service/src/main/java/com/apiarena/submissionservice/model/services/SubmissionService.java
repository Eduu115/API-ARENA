package com.apiarena.submissionservice.model.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.apiarena.submissionservice.model.dto.CreateSubmissionResponse;
import com.apiarena.submissionservice.model.dto.LogsResponse;
import com.apiarena.submissionservice.model.dto.SubmissionDTO;
import com.apiarena.submissionservice.model.dto.SubmissionStatusCacheDTO;
import com.apiarena.submissionservice.model.dto.SubmissionSummaryDTO;
import com.apiarena.submissionservice.model.entities.Submission;
import com.apiarena.submissionservice.repository.SubmissionRepository;

@Service
public class SubmissionService implements ISubmissionService {

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private UploadStorageService uploadStorageService;

    @Autowired
    private SubmissionStatusCacheService statusCacheService;

    @Autowired
    private SubmissionWebSocketService webSocketService;

    @Override
    @Transactional
    public CreateSubmissionResponse createSubmission(Long challengeId, Long userId, MultipartFile zipFile) {

        if (challengeId == null) {
            throw new IllegalArgumentException("Challenge ID is required");
        }
        if (userId == null) {
            throw new IllegalArgumentException("User must be authenticated");
        }

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
        new Thread(() -> simulatePipeline(subId)).start();

        return new CreateSubmissionResponse(saved.getId(), saved.getStatus().name(), wsTopic);
    }

    private void simulatePipeline(Long submissionId) {
        try {
            Thread.sleep(2000);

            appendBuildLogs(submissionId,
                "[BUILD] Scanning for projects...\n" +
                "[BUILD] Resolving dependencies...\n");
            updateStatus(submissionId, Submission.Status.BUILDING, null);

            Thread.sleep(3000);

            appendBuildLogs(submissionId,
                "[BUILD] Compiling 14 source files...\n" +
                "[BUILD] Running static analysis...\n" +
                "[BUILD] Packaging application...\n" +
                "[BUILD] BUILD SUCCESS (3.2s)\n");

            Thread.sleep(1500);

            updateStatus(submissionId, Submission.Status.TESTING, null);

            Thread.sleep(2000);

            ThreadLocalRandom rng = ThreadLocalRandom.current();
            int totalTests = rng.nextInt(10, 18);
            int passed = totalTests - rng.nextInt(0, 3);
            StringBuilder testLog = new StringBuilder();
            String[] methods = {"GET", "POST", "PUT", "DELETE", "PATCH"};
            String[] paths = {"/api/items", "/api/items/1", "/api/items?page=1", "/api/items/search", "/api/items/1/status"};

            for (int i = 0; i < totalTests; i++) {
                String method = methods[rng.nextInt(methods.length)];
                String path = paths[rng.nextInt(paths.length)];
                int ms = rng.nextInt(5, 80);
                boolean pass = i < passed;
                int status = pass ? (method.equals("POST") ? 201 : method.equals("DELETE") ? 204 : 200) : 500;
                testLog.append(String.format("[TEST] %s %s => %d (%dms) %s%n",
                    method, path, status, ms, pass ? "PASS" : "FAIL"));
            }
            testLog.append(String.format("%n[RESULT] %d/%d tests passed%n", passed, totalTests));

            appendTestLogs(submissionId, testLog.toString());

            Thread.sleep(2000);

            double passRate = (double) passed / totalTests;
            BigDecimal correctness = BigDecimal.valueOf(passRate * 500).setScale(2, RoundingMode.HALF_UP);
            BigDecimal performance = BigDecimal.valueOf(rng.nextDouble(150, 280)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal design = BigDecimal.valueOf(rng.nextDouble(120, 250)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal total = correctness.add(performance).add(design);

            Submission sub = submissionRepository.findById(submissionId).orElse(null);
            if (sub == null) return;

            sub.setAvgResponseMs(rng.nextInt(15, 90));
            sub.setP95ResponseMs(rng.nextInt(90, 250));
            sub.setP99ResponseMs(rng.nextInt(250, 500));
            sub.setRps(rng.nextInt(600, 2000));
            sub.setTotalRequests(totalTests * rng.nextInt(200, 400));
            sub.setFailedRequests(totalTests - passed);
            sub.setRestComplianceScore(BigDecimal.valueOf(rng.nextDouble(70, 98)).setScale(2, RoundingMode.HALF_UP));
            submissionRepository.save(sub);

            updateScores(submissionId, total, correctness, performance, design);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            updateStatus(submissionId, Submission.Status.FAILED, "Pipeline interrupted");
        } catch (Exception e) {
            updateStatus(submissionId, Submission.Status.FAILED, e.getMessage());
        }
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
        return submissionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(SubmissionSummaryDTO::fromEntity)
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
