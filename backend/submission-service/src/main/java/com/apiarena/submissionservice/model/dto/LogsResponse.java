package com.apiarena.submissionservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LogsResponse {

    private String buildLogs;
    private String testLogs;
}
