package com.apiarena.submissionservice.model.services;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

import com.apiarena.submissionservice.model.dto.ChallengeAttemptStatusDTO;
import com.apiarena.submissionservice.model.dto.CreateSubmissionResponse;
import com.apiarena.submissionservice.model.dto.LogsResponse;
import com.apiarena.submissionservice.model.dto.ReplayTimelineResponse;
import com.apiarena.submissionservice.model.dto.SubmissionDTO;
import com.apiarena.submissionservice.model.dto.SubmissionSummaryDTO;
import com.apiarena.submissionservice.model.dto.SubmissionZipDownload;
import com.apiarena.submissionservice.model.entities.Submission;

public interface ISubmissionService {

    CreateSubmissionResponse createSubmission(Long challengeId, Long userId, MultipartFile zipFile,
            boolean rateLimitBypass, Integer developmentTimeSeconds);

    ChallengeAttemptStatusDTO getChallengeAttemptStatus(Long userId, Long challengeId);

    SubmissionDTO getSubmissionById(Long id, Long userId, boolean isAdminOrTeacher);

    LogsResponse getLogs(Long id, Long userId, boolean isAdminOrTeacher);

    ReplayTimelineResponse getReplayTimeline(Long id, Long userId, boolean isAdminOrTeacher);

    List<SubmissionSummaryDTO> getMySubmissions(Long userId);

    List<SubmissionSummaryDTO> getTeacherStudentSubmissions(Long teacherId, Long studentId);

    List<SubmissionSummaryDTO> getTeacherChallengeSubmissions(Long teacherId, Long challengeId);

    Map<Long, Long> getTeacherStudentsSubmissionCounts(Long teacherId, List<Long> studentIds);

    SubmissionZipDownload prepareZipDownload(Long id, Long userId, boolean isAdmin, boolean isTeacher);

    void deleteSubmission(Long id, Long userId, boolean isAdminOrTeacher);

    void updateStatus(Long submissionId, Submission.Status status, String errorMessage);

    void appendBuildLogs(Long submissionId, String logs);

    void appendTestLogs(Long submissionId, String logs);

    void updateScores(Long submissionId, BigDecimal totalScore, BigDecimal correctnessScore,
                      BigDecimal performanceScore, BigDecimal designScore);
}
