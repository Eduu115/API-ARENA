package com.apiarena.submissionservice.model.dto;

import java.nio.file.Path;

/**
 * ZIP file path plus informational retention instant (ISO-8601 UTC) for clients to show expiry.
 */
public record SubmissionZipDownload(Path path, String expiresAtIso) {}
