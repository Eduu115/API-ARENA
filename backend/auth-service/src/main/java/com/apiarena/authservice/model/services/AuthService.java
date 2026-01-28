package com.apiarena.authservice.model.services;

import org.springframework.beans.factory.annotation.Autowired;

import com.apiarena.authservice.exception.BadRequestException;
import com.apiarena.authservice.model.dto.*;
import com.apiarena.authservice.model.entities.RefreshToken;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.repository.UserRepository;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private RefreshTokenService refreshTokenService;
    @Autowired
    private UserService userService;
    @Autowired
    private AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) { // para los errores, uso los exception handleres que he creado, estan en /exception
        // Validar que el email no exista
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        // Validar que el username no exista
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already taken");
        }

        // Determinar el rol
        User.Role role = User.Role.STUDENT;
        if (request.getRole() != null) {
            try {
                role = User.Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid role: " + request.getRole());
            }
        }

        // Crear usuario
        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .role(role)
            .build();

        User savedUser = userRepository.save(user);

        // Generar tokens
        UserDetails userDetails = userService.loadUserByUsername(savedUser.getEmail());
        String accessToken = jwtService.generateAccessToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser);

        return AuthResponse.builder()
            .user(UserDTO.fromEntity(savedUser))
            .accessToken(accessToken)
            .refreshToken(refreshToken.getToken())
            .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // Autenticar usuario
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
            )
        );

        // Obtener usuario
        User user = userService.getUserEntityByEmail(request.getEmail());

        // Actualizar last login
        userService.updateLastLogin(request.getEmail());

        // Generar tokens
        UserDetails userDetails = userService.loadUserByUsername(request.getEmail());
        String accessToken = jwtService.generateAccessToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
            .user(UserDTO.fromEntity(user))
            .accessToken(accessToken)
            .refreshToken(refreshToken.getToken())
            .build();
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        // Verificar refresh token
        RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(request.getRefreshToken());

        // Obtener usuario
        User user = refreshToken.getUser();

        // Generar nuevo access token
        UserDetails userDetails = userService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateAccessToken(userDetails);

        // Rotar refresh token (generar uno nuevo)
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);

        // Revocar el refresh token viejo
        refreshTokenService.revokeRefreshToken(request.getRefreshToken());

        return AuthResponse.builder()
                .user(UserDTO.fromEntity(user))
                .accessToken(accessToken)
                .refreshToken(newRefreshToken.getToken())
                .build();
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isEmpty()) {
            refreshTokenService.revokeRefreshToken(refreshToken);
        }
    }
}