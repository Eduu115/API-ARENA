package com.apiarena.authservice.restcontroller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.authservice.model.dto.AuthResponse;
import com.apiarena.authservice.model.dto.TwoFactorEnrollRequest;
import com.apiarena.authservice.model.dto.TwoFactorVerifyRequest;
import com.apiarena.authservice.model.services.EmailTwoFactorService;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Email-code step after the password. Public because the only credential is the pending token.
 */
@RestController
@RequestMapping("/api/auth/2fa/email")
@RequiredArgsConstructor
public class EmailTwoFactorController {

    private final EmailTwoFactorService emailTwoFactorService;

    @PostMapping("/send")
    @Operation(summary = "Email a login code", description = "Sends a one-time code when email 2FA is enabled for this pending login")
    public ResponseEntity<Map<String, Object>> send(@Valid @RequestBody TwoFactorEnrollRequest request) {
        emailTwoFactorService.sendLoginCode(request.getPendingToken());
        return ResponseEntity.ok(Map.of("expiresInSeconds", 600));
    }

    @PostMapping("/verify")
    @Operation(summary = "Finish login with an email code", description = "Checks the one-time code and issues access + refresh tokens")
    public ResponseEntity<AuthResponse> verify(@Valid @RequestBody TwoFactorVerifyRequest request) {
        return ResponseEntity.ok(emailTwoFactorService.verifyLogin(request.getPendingToken(), request.getCode()));
    }
}
