package com.apiarena.authservice.model.services;

import org.springframework.security.core.userdetails.UserDetailsService;

import com.apiarena.authservice.model.dto.PublicProfileDTO;
import com.apiarena.authservice.model.dto.RewardRequest;
import com.apiarena.authservice.model.dto.UpdateProfileRequest;
import com.apiarena.authservice.model.dto.UserDTO;
import com.apiarena.authservice.model.entities.User;

public interface IUserService extends UserDetailsService {

    UserDTO getUserById(Long id);

    PublicProfileDTO getPublicProfile(Long id);

    UserDTO getUserByEmail(String email);

    UserDTO updateProfile(Long userId, UpdateProfileRequest request);

    void updateLastLogin(String email);

    User getUserEntityByEmail(String email);

    void applyReward(Long userId, RewardRequest request);

    void sendNotificationEmail(Long userId, String title, String body, String importanceLabel);

    void addDevelopmentTimeSeconds(Long userId, int seconds);

    void addBrowsingTimeSeconds(Long userId, int seconds);

    /** Send new-challenge email to opted-in verified students (internal; excludes creator). */
    void notifyNewChallengeEmailSubscribers(Long challengeId, String challengeTitle, Long createdByUserId);
}
