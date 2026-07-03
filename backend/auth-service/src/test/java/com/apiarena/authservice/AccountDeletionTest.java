package com.apiarena.authservice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.apiarena.authservice.exception.ApiException;
import com.apiarena.authservice.model.dto.RegisterRequest;
import com.apiarena.authservice.model.services.AuthService;
import com.apiarena.authservice.repository.AccountDeletionRepository;
import com.apiarena.authservice.repository.UserRepository;

/** Guards the deferred-deletion invariant: a recently deleted account's email stays reserved on registration. */
@ExtendWith(MockitoExtension.class)
class AccountDeletionTest {

    @Mock UserRepository userRepository;
    @Mock AccountDeletionRepository accountDeletionRepository;
    @InjectMocks AuthService authService;

    private static RegisterRequest validRequest() {
        RegisterRequest r = new RegisterRequest();
        r.setUsername("newbie");
        r.setEmail("Gone@Example.com");
        r.setPassword("Arena2025!");
        r.setDateOfBirth(LocalDate.now().minusYears(20));
        r.setAcceptTerms(true);
        return r;
    }

    @Test
    void register_rejectsReservedEmail() {
        when(userRepository.existsByEmail("gone@example.com")).thenReturn(false);
        when(accountDeletionRepository.existsByEmailIgnoreCase("gone@example.com")).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class,
                () -> authService.register(validRequest(), null));

        assertEquals("AUTH_EMAIL_RESERVED", ex.getCode());
        verify(userRepository, never()).save(any());
        verify(userRepository, never()).existsByUsername(anyString());
    }
}
