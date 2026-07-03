package com.apiarena.authservice.restcontroller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.authservice.model.dto.AuthResponse;
import com.apiarena.authservice.model.dto.TwoFactorEnrollRequest;
import com.apiarena.authservice.model.dto.TwoFactorEnrollResponse;
import com.apiarena.authservice.model.dto.TwoFactorVerifyRequest;
import com.apiarena.authservice.model.services.AdminTwoFactorService;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * ADMIN 2FA endpoints. Public (permitAll) because no full session exists yet — each call is
 * authorized by the short-lived pending token issued after the password step.
 */
@RestController
@RequestMapping("/api/auth/admin/2fa")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminTwoFactorService adminTwoFactorService;

    @PostMapping("/enroll")
    @Operation(summary = "Begin ADMIN 2FA enrolment", description = "Returns a TOTP secret to add to an authenticator app")
    public ResponseEntity<TwoFactorEnrollResponse> enroll(@Valid @RequestBody TwoFactorEnrollRequest request) {
        return ResponseEntity.ok(adminTwoFactorService.enroll(request.getPendingToken()));
    }

    @PostMapping("/verify")
    @Operation(summary = "Complete ADMIN 2FA", description = "Verify the TOTP code and issue access + refresh tokens")
    public ResponseEntity<AuthResponse> verify(@Valid @RequestBody TwoFactorVerifyRequest request) {
        return ResponseEntity.ok(adminTwoFactorService.verify(request.getPendingToken(), request.getCode()));
    }
}
