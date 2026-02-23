package com.apiarena.submissionservice.config;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionPrincipal {

    private String email;
    private Long userId;
}
