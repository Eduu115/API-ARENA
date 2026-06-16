package com.apiarena.authservice.model.services;

import com.apiarena.authservice.model.dto.AuthResponse;
import com.apiarena.authservice.model.dto.LoginRequest;
import com.apiarena.authservice.model.dto.RefreshTokenRequest;
import com.apiarena.authservice.model.dto.RegisterRequest;
import com.apiarena.authservice.model.dto.VerifyEmailResponseDTO;

public interface IAuthService {

    AuthResponse register(RegisterRequest request, String acceptLanguage);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(String refreshToken);

    VerifyEmailResponseDTO verifyEmail(String token);

    void resendVerificationEmail(String email);

    void requestPasswordReset(String email);

    void resetPassword(String token, String newPassword);
}
