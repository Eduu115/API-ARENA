package com.apiarena.authservice.model.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BanRequest {
    /** Optional classification for analytics (e.g. CHEATING, TOXICITY). */
    @Size(max = 40)
    private String category;

    @NotBlank
    @Size(max = 120)
    private String reason;

    @Size(max = 500)
    private String description;

    /** Optional temporary-ban expiry (local date-time). Null = permanent. */
    private LocalDateTime until;
}
