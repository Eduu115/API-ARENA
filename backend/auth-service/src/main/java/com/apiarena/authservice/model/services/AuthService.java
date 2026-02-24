package com.apiarena.authservice.model.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.authservice.model.dto.AuthResponse;
import com.apiarena.authservice.model.dto.LoginRequest;
import com.apiarena.authservice.model.dto.RefreshTokenRequest;
import com.apiarena.authservice.model.dto.RegisterRequest;
import com.apiarena.authservice.model.dto.UserDTO;
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

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }

        User.Role role = User.Role.STUDENT;
        if (request.getRole() != null) {
            try {
                role = User.Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid role: " + request.getRole());
            }
        }

        User u = new User(
            request.getUsername(),
            request.getEmail(),
            passwordEncoder.encode(request.getPassword()),
            role
        );

        User savedUser = userRepository.save(u);

        return new AuthResponse(UserDTO.fromEntity(savedUser), null, null);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
            )
        );

        User user = userService.getUserEntityByEmail(request.getEmail());

        userService.updateLastLogin(request.getEmail());

        UserDetails userDetails = userService.loadUserByUsername(request.getEmail());
        String accessToken = jwtService.generateAccessToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return new AuthResponse(UserDTO.fromEntity(user), accessToken, refreshToken.getToken());
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {

        RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(request.getRefreshToken());

        User user = refreshToken.getUser();

        UserDetails userDetails = userService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateAccessToken(userDetails);

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
}
