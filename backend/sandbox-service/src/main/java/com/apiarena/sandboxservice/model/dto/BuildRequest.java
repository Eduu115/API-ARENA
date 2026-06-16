package com.apiarena.sandboxservice.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BuildRequest {

    @NotNull(message = "Submission ID is required")
    private Long submissionId;

    private String zipFilePath;
}
