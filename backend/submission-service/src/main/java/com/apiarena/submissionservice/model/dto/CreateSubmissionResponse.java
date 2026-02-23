package com.apiarena.submissionservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSubmissionResponse {

    private Long submissionId;
    private String status;
    private String wsTopic;
}
