package com.apiarena.aireviewservice.restcontroller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.apiarena.aireviewservice.model.dto.AiReviewRequest;
import com.apiarena.aireviewservice.model.dto.AiReviewResponse;
import com.apiarena.aireviewservice.model.services.AiReviewService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/internal/ai-review")
@Tag(name = "AI Review", description = "Internal AI review operations")
public class AiReviewController {

    private final AiReviewService aiReviewService;

    @Value("${ai-review.internal-token:}")
    private String internalToken;

    public AiReviewController(AiReviewService aiReviewService) {
        this.aiReviewService = aiReviewService;
    }

    @PostMapping("/analyze")
    @Operation(summary = "Analyze submission quality", description = "Returns score and suggestions for a submission")
    public ResponseEntity<AiReviewResponse> analyze(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @Valid @RequestBody AiReviewRequest request) {
        authorizeInternal(token);
        return ResponseEntity.ok(aiReviewService.review(request));
    }

    private void authorizeInternal(String token) {
        if (internalToken == null || internalToken.isBlank()) {
            return;
        }
        if (!internalToken.equals(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid internal token");
        }
    }
}
