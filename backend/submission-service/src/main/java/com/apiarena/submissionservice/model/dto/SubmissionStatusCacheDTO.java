package com.apiarena.submissionservice.model.dto;

import java.math.BigDecimal;
import com.apiarena.submissionservice.model.entities.Submission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionStatusCacheDTO {

    // DTO ligero para caché Redis y notificaciones WebSocket de estado en tiempo real
    private Long id;
    private String status;
    private String stage;
    private Integer percent;
    private String message;
    private BigDecimal totalScore;
    private String errorMessage;

    public static SubmissionStatusCacheDTO fromEntity(Submission s) {
        return SubmissionStatusCacheDTO.builder()
                .id(s.getId())
                .status(s.getStatus().name())
                .stage(s.getStatus().name())
                .percent(statusToPercent(s.getStatus()))
                .message(null)
                .totalScore(s.getTotalScore())
                .errorMessage(s.getErrorMessage())
                .build();
    }

    private static int statusToPercent(Submission.Status status) {
        return switch (status) {
            case PENDING -> 0;
            case BUILDING -> 50;
            case COMPLETED, FAILED -> 100;
        };
    }
}
