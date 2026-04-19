package com.apiarena.authservice.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class NewChallengePublishedRequest {

    @NotNull
    private Long challengeId;

    private String title;

    private Long createdByUserId;
}
