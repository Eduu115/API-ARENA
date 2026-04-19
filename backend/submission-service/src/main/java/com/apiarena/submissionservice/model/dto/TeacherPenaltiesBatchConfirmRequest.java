package com.apiarena.submissionservice.model.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherPenaltiesBatchConfirmRequest {

    @NotEmpty(message = "penalties must not be empty")
    @Size(max = 30, message = "at most 30 penalties per batch")
    @Valid
    private List<TeacherPenaltyApplyRequest> penalties;
}
