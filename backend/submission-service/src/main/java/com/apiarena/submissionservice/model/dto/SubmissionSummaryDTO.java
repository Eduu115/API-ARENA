package com.apiarena.submissionservice.model.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.apiarena.submissionservice.model.entities.Submission;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionSummaryDTO {

    // Para listados de submissions del usuario: versión ligera del DTO completo
    private Long id;
    private Long challengeId;
    private Long userId;
    private String status;
    private BigDecimal totalScore;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;

    public static SubmissionSummaryDTO fromEntity(Submission entity) {
        return new SubmissionSummaryDTO(
                entity.getId(),
                entity.getChallengeId(),
                entity.getUserId(),
                entity.getStatus().name(),
                entity.getTotalScore(),
                entity.getCreatedAt(),
                entity.getCompletedAt()
        );
    }
}
