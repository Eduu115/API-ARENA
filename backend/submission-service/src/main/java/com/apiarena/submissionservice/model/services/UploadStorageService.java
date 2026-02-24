package com.apiarena.submissionservice.model.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UploadStorageService {

    @Value("${submission.upload-dir:uploads}")
    private String uploadDir;

    @Value("${submission.max-file-size:52428800}")
    private long maxFileSize;

    private static final String[] ALLOWED_EXTENSIONS = {".zip"};

    public String storeZip(MultipartFile file, Long submissionId) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".zip")) {
            throw new IllegalArgumentException("Only ZIP files are allowed");
        }

        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("File size exceeds maximum allowed (" + (maxFileSize / 1024 / 1024) + " MB)");
        }

        try {
            Path basePath = Paths.get(uploadDir);
            Files.createDirectories(basePath);

            String safeName = submissionId + "_" + UUID.randomUUID().toString().substring(0, 8) + ".zip";
            Path targetPath = basePath.resolve(safeName);

            file.transferTo(targetPath.toFile());

            return targetPath.toString();
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to store file: " + e.getMessage());
        }
    }

    public Path getZipPath(String relativePath) {
        return Paths.get(relativePath);
    }
}
