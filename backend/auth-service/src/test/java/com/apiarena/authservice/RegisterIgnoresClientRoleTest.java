package com.apiarena.authservice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.apiarena.authservice.model.dto.AuthResponse;
import com.apiarena.authservice.model.dto.RegisterRequest;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.model.services.AuthService;
import com.apiarena.authservice.model.services.EmailDispatchService;
import com.apiarena.authservice.repository.AccountDeletionRepository;
import com.apiarena.authservice.repository.UserRepository;

/** Public registration must not honor a client-supplied role. */
@ExtendWith(MockitoExtension.class)
class RegisterIgnoresClientRoleTest {

    @Mock UserRepository userRepository;
    @Mock AccountDeletionRepository accountDeletionRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock EmailDispatchService emailDispatchService;
    @InjectMocks AuthService authService;

    @BeforeEach
    void stubs() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(accountDeletionRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "TEACHER"})
    void register_withPrivilegedRole_createsStudent(String requestedRole) {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newbie-" + requestedRole.toLowerCase());
        request.setEmail(requestedRole.toLowerCase() + "@example.com");
        request.setPassword("Arena2025!");
        request.setRole(requestedRole);
        request.setDateOfBirth(LocalDate.now().minusYears(20));
        request.setAcceptTerms(true);

        AuthResponse response = authService.register(request, null);

        assertEquals("STUDENT", response.getUser().getRole());

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository, atLeastOnce()).save(saved.capture());
        assertTrue(saved.getAllValues().stream().allMatch(user -> user.getRole() == User.Role.STUDENT));
    }
}
