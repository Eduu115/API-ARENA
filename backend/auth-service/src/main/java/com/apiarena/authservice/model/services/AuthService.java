package com.apiarena.authservice.model.services;

import java.time.LocalDateTime;
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

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static String newVerificationToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {

        String email = request.getEmail().trim().toLowerCase();

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

        User savedUser = userRepository.save(u);

        String token = newVerificationToken();
        savedUser.setEmailVerificationToken(token);
        savedUser.setEmailVerificationExpiresAt(LocalDateTime.now().plusHours(48));
        savedUser = userRepository.save(savedUser);

        emailDispatchService.sendVerificationEmail(
                savedUser.getEmail(),
                savedUser.getUsername(),
                token);

        emailDispatchService.sendWelcomeBetaLegacyEmail(savedUser.getEmail(), savedUser.getUsername());

        emailDispatchService.sendFirstStepsBetaEmail(savedUser.getEmail(), savedUser.getUsername());

        welcomeNotificationDispatchService.sendWelcome(savedUser.getId(), savedUser.getUsername());

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
}
