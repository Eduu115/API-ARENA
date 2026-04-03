package com.apiarena.testingservice.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.apiarena.testingservice.model.entities.TestResult;

public interface TestResultRepository extends JpaRepository<TestResult, Long> {

    List<TestResult> findBySubmissionIdOrderByCreatedAtAsc(Long submissionId);

    List<TestResult> findBySubmissionIdAndTestType(Long submissionId, TestResult.TestType testType);

    @Query("SELECT COUNT(t) FROM TestResult t WHERE t.submissionId = :sid AND t.status = 'PASSED'")
    Integer countPassedBySubmissionId(@Param("sid") Long submissionId);

    @Query("SELECT COUNT(t) FROM TestResult t WHERE t.submissionId = :sid")
    Integer countBySubmissionId(@Param("sid") Long submissionId);

    @Query("SELECT COALESCE(SUM(t.scoreAwarded), 0) FROM TestResult t WHERE t.submissionId = :sid")
    Integer sumScoreBySubmissionId(@Param("sid") Long submissionId);
}
