package com.apiarena.authservice.model.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.HashMap;
import java.util.Map;
import java.util.HexFormat;
import java.security.SecureRandom;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.apiarena.authservice.model.dto.AuthResponse;
import com.apiarena.authservice.model.dto.LoginRequest;
import com.apiarena.authservice.model.dto.RefreshTokenRequest;
import com.apiarena.authservice.model.dto.RegisterRequest;
import com.apiarena.authservice.model.dto.UserDTO;
import com.apiarena.authservice.model.dto.VerifyEmailResponseDTO;
import com.apiarena.authservice.model.entities.RefreshToken;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.repository.UserRepository;

@Service
public class AuthService implements IAuthService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private IJwtService jwtService;
    @Autowired
    private IRefreshTokenService refreshTokenService;
    @Autowired
    private IUserService userService;
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private EmailDispatchService emailDispatchService;

    @Autowired
    private WelcomeNotificationDispatchService welcomeNotificationDispatchService;

    @Autowired
    private AchievementService achievementService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /** Minimum age to give valid consent on your own in Spain (LOPDGDD art. 7). */
    private static final int MIN_AGE_YEARS = 14;

    /** Version of the Privacy Policy / Terms in force; bump when the legal texts change. */
    private static final String CURRENT_CONSENT_VERSION = "1.0";

    private static String newVerificationToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        LocalDate dob = request.getDateOfBirth();
        if (dob == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date of birth is required");
        }
        LocalDate today = LocalDate.now();
        if (dob.isAfter(today)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date of birth must be in the past");
        }
        if (Period.between(dob, today).getYears() < MIN_AGE_YEARS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "You must be at least " + MIN_AGE_YEARS + " years old to register");
        }

        if (!request.isAcceptTerms()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "You must accept the Privacy Policy and Terms to register");
        }

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }

        User.Role role = User.Role.STUDENT;
        if (request.getRole() != null) {
            try {
                role = User.Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role: " + request.getRole());
            }
        }

        User u = new User(
            request.getUsername(),
            email,
            passwordEncoder.encode(request.getPassword()),
            role
        );
        u.setDateOfBirth(dob);
        u.setPrivacyConsentAt(LocalDateTime.now());
        u.setPrivacyConsentVersion(CURRENT_CONSENT_VERSION);

        User savedUser = userRepository.save(u);

        String token = newVerificationToken();
        savedUser.setEmailVerificationToken(token);
        savedUser.setEmailVerificationExpiresAt(LocalDateTime.now().plusHours(48));
        savedUser = userRepository.save(savedUser);

        emailDispatchService.sendVerificationEmail(
                savedUser.getEmail(),
                savedUser.getUsername(),
                token);

        return new AuthResponse(UserDTO.fromEntity(savedUser), null, null);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                    email,
                    request.getPassword()
            )
        );

        User user = userService.getUserEntityByEmail(email);

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Email not verified. Check your inbox or resend the verification link.");
        }

        userService.updateLastLogin(email);

        UserDetails userDetails = userService.loadUserByUsername(email);
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        String accessToken = jwtService.generateAccessToken(claims, userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return new AuthResponse(UserDTO.fromEntity(user), accessToken, refreshToken.getToken());
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {

        RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(request.getRefreshToken());

        User user = refreshToken.getUser();

        UserDetails userDetails = userService.loadUserByUsername(user.getEmail());
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        String accessToken = jwtService.generateAccessToken(claims, userDetails);

        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);

        refreshTokenService.revokeRefreshToken(request.getRefreshToken());

        return new AuthResponse(UserDTO.fromEntity(user), accessToken, newRefreshToken.getToken());
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isEmpty()) {
            refreshTokenService.revokeRefreshToken(refreshToken);
        }
    }

    @Override
    @Transactional
    public VerifyEmailResponseDTO verifyEmail(String token) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification token is required");
        }
        User user = userRepository.findByEmailVerificationToken(token.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification link."));
        if (user.getEmailVerificationExpiresAt() == null
                || user.getEmailVerificationExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Verification link expired. Request a new one from the login page.");
        }
        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiresAt(null);
        userRepository.save(user);

        emailDispatchService.sendWelcomeBetaLegacyEmail(user.getEmail(), user.getUsername());
        emailDispatchService.sendFirstStepsBetaEmail(user.getEmail(), user.getUsername());
        welcomeNotificationDispatchService.sendWelcome(user.getId(), user.getUsername());
        achievementService.syncForUserId(user.getId());

        return new VerifyEmailResponseDTO(true, "Email verified. You can log in.");
    }

    @Override
    @Transactional
    public void resendVerificationEmail(String email) {
        if (email == null || email.isBlank()) {
            return;
        }
        userRepository.findByEmailIgnoreCase(email.trim()).ifPresent(user -> {
            if (Boolean.TRUE.equals(user.getEmailVerified())) {
                return;
            }
            String token = newVerificationToken();
            user.setEmailVerificationToken(token);
            user.setEmailVerificationExpiresAt(LocalDateTime.now().plusHours(48));
            userRepository.save(user);
            emailDispatchService.sendVerificationEmail(user.getEmail(), user.getUsername(), token);
        });
    }

    @Override
    @Transactional
    public void requestPasswordReset(String email) {
        if (email == null || email.isBlank()) {
            return;
        }
        // Silent on purpose: never reveal whether an account exists for this email.
        userRepository.findByEmailIgnoreCase(email.trim()).ifPresent(user -> {
            String token = newVerificationToken();
            user.setPasswordResetToken(token);
            user.setPasswordResetExpiresAt(LocalDateTime.now().plusHours(1));
            userRepository.save(user);
            emailDispatchService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), token);
        });
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token is required");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Password must be at least 6 characters");
        }
        User user = userRepository.findByPasswordResetToken(token.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or used reset link."));
        if (user.getPasswordResetExpiresAt() == null
                || user.getPasswordResetExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Reset link expired. Request a new one.");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiresAt(null);
        userRepository.save(user);

        // Invalidate all existing sessions after a password change.
        refreshTokenService.revokeAllUserTokens(user);
    }
}
