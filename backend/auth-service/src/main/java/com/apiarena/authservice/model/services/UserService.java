package com.apiarena.authservice.model.services;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.apiarena.authservice.model.dto.PublicProfileDTO;
import com.apiarena.authservice.model.dto.RewardRequest;
import com.apiarena.authservice.model.dto.UpdateProfileRequest;
import com.apiarena.authservice.model.dto.UserDTO;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
public class UserService implements IUserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailDispatchService emailDispatchService;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmailIgnoreCase(email.trim())
            .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        return org.springframework.security.core.userdetails.User.builder()
            .username(user.getEmail())
            .password(user.getPasswordHash())
            .roles(user.getRole().name())
            .build();
    }

    @Override
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        return UserDTO.fromEntity(user);
    }

    @Override
    public PublicProfileDTO getPublicProfile(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        return PublicProfileDTO.fromEntity(user);
    }

    @Override
    public UserDTO getUserByEmail(String email) {
        User user = userRepository.findByEmailIgnoreCase(email.trim())
            .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
        return UserDTO.fromEntity(user);
    }

    @Override
    @Transactional
    public UserDTO updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getGithubUsername() != null) {
            user.setGithubUsername(request.getGithubUsername());
        }

        User savedUser = userRepository.save(user);
        return UserDTO.fromEntity(savedUser);
    }

    @Override
    @Transactional
    public void updateLastLogin(String email) {
        User user = userRepository.findByEmailIgnoreCase(email.trim())
            .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    public User getUserEntityByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email.trim())
            .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
    }

    @Override
    @Transactional
    public void applyReward(Long userId, RewardRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        int xp = request.getXpEarned() != null ? request.getXpEarned() : 0;
        int elo = request.getEloChange() != null ? request.getEloChange() : 0;

        user.setExperiencePoints(user.getExperiencePoints() + xp);
        user.setRating(user.getRating() + elo);

        user.setLevel(calculateLevel(user.getExperiencePoints()));

        if (Boolean.TRUE.equals(request.getIsFirstCompletion())) {
            user.setTotalChallengesCompleted(user.getTotalChallengesCompleted() + 1);
        }

        userRepository.save(user);
    }

    private int calculateLevel(int totalXp) {
        // level = floor((1 + sqrt(1 + 8*xp/300)) / 2)
        // L1: 0, L2: 300, L3: 900, L4: 1800, L5: 3000, L6: 4500 ...
        return (int) Math.floor((1.0 + Math.sqrt(1.0 + 8.0 * totalXp / 300.0)) / 2.0);
    }

    @Override
    @Transactional
    public void sendNotificationEmail(Long userId, String title, String body, String importanceLabel) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        emailDispatchService.sendNotificationAlertEmail(
                user.getEmail(),
                user.getUsername(),
                title,
                body,
                importanceLabel);
    }

    @Override
    @Transactional
    public void addDevelopmentTimeSeconds(Long userId, int seconds) {
        if (seconds <= 0) {
            return;
        }
        int capped = Math.min(seconds, 604800);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        long cur = user.getTotalDevelopmentSeconds() != null ? user.getTotalDevelopmentSeconds() : 0L;
        user.setTotalDevelopmentSeconds(cur + capped);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void addBrowsingTimeSeconds(Long userId, int seconds) {
        if (seconds <= 0) {
            return;
        }
        int capped = Math.min(seconds, 120);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        long cur = user.getTotalBrowsingSeconds() != null ? user.getTotalBrowsingSeconds() : 0L;
        user.setTotalBrowsingSeconds(cur + capped);
        userRepository.save(user);
    }
}
