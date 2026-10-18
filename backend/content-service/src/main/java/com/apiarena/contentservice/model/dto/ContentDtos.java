package com.apiarena.contentservice.model.dto;

import java.time.Instant;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class ContentDtos {
    private ContentDtos() {}

    public record ManualTranslation(
            String locale,
            String title,
            String excerpt,
            String bodyMd
    ) {}

    public record SavePostRequest(
            @NotBlank String type,
            String slug,
            @NotBlank String sourceLocale,
            @Size(max = 80) String versionLabel,
            @Size(max = 500) String coverImageUrl,
            @NotBlank @Size(max = 300) String title,
            @Size(max = 600) String excerpt,
            @NotBlank @Size(max = 100_000) String bodyMd,
            List<@Size(max = 40) String> tags,
            ManualTranslation other
    ) {}

    public record TranslationView(
            String locale,
            String title,
            String excerpt,
            String bodyMd,
            boolean machineTranslated,
            Instant translatedAt
    ) {}

    public record AdminPostResponse(
            Long id,
            String type,
            String slug,
            String status,
            String sourceLocale,
            String versionLabel,
            String coverImageUrl,
            Long authorId,
            Instant publishedAt,
            Instant updatedAt,
            List<String> tags,
            List<TranslationView> translations,
            String translationWarning
    ) {}

    public record AdminPostSummary(
            Long id,
            String type,
            String slug,
            String status,
            String sourceLocale,
            String title,
            String versionLabel,
            Instant publishedAt,
            Instant updatedAt
    ) {}

    public record PostPage(
            List<?> items,
            int page,
            int size,
            long total
    ) {}

    public record PublicPost(
            String type,
            String slug,
            String title,
            String excerpt,
            String bodyMd,
            String bodyHtml,
            String locale,
            String requestedLocale,
            boolean fallback,
            String versionLabel,
            String coverImageUrl,
            Instant publishedAt,
            Instant updatedAt,
            List<String> tags
    ) {}

    public record RoadmapItemView(
            String slug,
            int position,
            String status,
            String title,
            String summary,
            boolean fallback
    ) {}

    public record RoadmapPhaseView(
            String slug,
            int position,
            String status,
            String targetLabel,
            String title,
            String summary,
            boolean fallback,
            List<RoadmapItemView> items
    ) {}

    public record RoadmapResponse(
            String locale,
            boolean fallback,
            List<RoadmapPhaseView> phases
    ) {}

    public record ImportResponse(
            String title,
            String versionLabel,
            List<String> tags,
            String bodyMd
    ) {}
}
