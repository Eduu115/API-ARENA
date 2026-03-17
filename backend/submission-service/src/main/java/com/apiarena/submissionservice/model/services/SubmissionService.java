package com.apiarena.submissionservice.model.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
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

        return new CreateSubmissionResponse(saved.getId(), saved.getStatus().name(), wsTopic);
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
