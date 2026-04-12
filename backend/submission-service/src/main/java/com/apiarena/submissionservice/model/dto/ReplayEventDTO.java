package com.apiarena.submissionservice.model.dto;

import java.time.LocalDateTime;
import java.util.Map;

import com.apiarena.submissionservice.model.entities.ReplayEvent;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReplayEventDTO {

    private Long id;
    private String stage;
    private String eventType;
    private String severity;
    private String message;
    private Map<String, Object> metadata;
    private LocalDateTime occurredAt;

    public static ReplayEventDTO fromEntity(ReplayEvent e) {
        return ReplayEventDTO.builder()
                .id(e.getId())
                .stage(e.getStage())
                .eventType(e.getEventType())
                .severity(e.getSeverity())
                .message(e.getMessage())
                .metadata(e.getMetadata())
                .occurredAt(e.getOccurredAt())
                .build();
    }
}
