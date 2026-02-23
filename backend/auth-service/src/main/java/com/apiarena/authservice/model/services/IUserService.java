package com.apiarena.authservice.model.services;

import org.springframework.security.core.userdetails.UserDetailsService;

import com.apiarena.authservice.model.dto.UpdateProfileRequest;
import com.apiarena.authservice.model.dto.UserDTO;
import com.apiarena.authservice.model.entities.User;

public interface IUserService extends UserDetailsService {

    UserDTO getUserById(Long id);

    UserDTO getUserByEmail(String email);

    UserDTO updateProfile(Long userId, UpdateProfileRequest request);

    void updateLastLogin(String email);

    User getUserEntityByEmail(String email);
}
