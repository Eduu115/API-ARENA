package com.apiarena.submissionservice.model.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherSubmissionReviewRequest {

    @Size(max = 8000)
    private String personalNote;

    /** Optional short notes per score pillar (keys: correctness, performance, design, aiReview). */
    @Size(max = 12)
    private Map<String, String> zoneNotes;

    /**
     * Structured feedback similar to AI review, e.g. summary (string), strengths (list of strings),
     * suggestions (list of strings).
     */
    private Map<String, Object> structuredFeedback;

    @Valid
    @Size(max = 15)
    @Builder.Default
    private List<TeacherBonusLineRequest> bonuses = new ArrayList<>();

    /** When true (default), student receives an in-app notification. */
    @Builder.Default
    private Boolean notifyStudent = Boolean.TRUE;
}
