package com.apiarena.authservice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;

import com.apiarena.authservice.model.dto.AuthResponse;
import com.apiarena.authservice.model.dto.LoginRequest;
import com.apiarena.authservice.model.dto.UserDTO;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.model.services.AuthService;
import com.apiarena.authservice.model.services.IJwtService;
import com.apiarena.authservice.model.services.IUserService;
import com.apiarena.authservice.model.services.TwoFactorMethodService;

@ExtendWith(MockitoExtension.class)
class AuthServiceTwoFactorLoginTest {

    @Mock AuthenticationManager authenticationManager;
    @Mock IUserService userService;
    @Mock IJwtService jwtService;
    @Mock TwoFactorMethodService twoFactorMethodService;
    @InjectMocks AuthService authService;

    @Test
    void loginWithEmailTwoFactorStopsAtPendingToken() {
        User user = student();
        when(userService.getUserEntityByEmail(user.getEmail())).thenReturn(user);
        when(twoFactorMethodService.hasAnyTwoFactorEnabled(user)).thenReturn(true);
        when(twoFactorMethodService.loginView(user)).thenReturn(
                new TwoFactorMethodService.TwoFactorLoginView(false, "EMAIL", List.of("EMAIL"), true));
        when(twoFactorMethodService.enrich(any(UserDTO.class), any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generatePendingTwoFactorToken(user.getEmail(), user.getId())).thenReturn("pending-email");

        AuthResponse response = authService.login(login());

        assertEquals(Boolean.TRUE, response.getTwoFactorRequired());
        assertEquals(Boolean.FALSE, response.getTwoFactorEnrolled());
        assertEquals("EMAIL", response.getTwoFactorPrimary());
        assertEquals(List.of("EMAIL"), response.getTwoFactorMethods());
        assertEquals(Boolean.TRUE, response.getEmailTwoFactorAllowed());
        assertEquals("pending-email", response.getPendingToken());
        assertNull(response.getAccessToken());
        verify(authenticationManager).authenticate(any());
    }

    @Test
    void adminWithoutTotpStillRequiresEnrolment() {
        User admin = new User("sysop", "sysop@apiarena.dev", "hash", User.Role.ADMIN);
        admin.setId(1L);
        admin.setEmailVerified(true);
        admin.setIsActive(true);
        when(userService.getUserEntityByEmail(admin.getEmail())).thenReturn(admin);
        when(twoFactorMethodService.loginView(admin)).thenReturn(
                new TwoFactorMethodService.TwoFactorLoginView(false, null, List.of(), false));
        when(twoFactorMethodService.enrich(any(UserDTO.class), any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generatePendingTwoFactorToken(admin.getEmail(), admin.getId())).thenReturn("pending-admin");

        LoginRequest request = login();
        request.setEmail(admin.getEmail());
        AuthResponse response = authService.login(request);

        assertTrue(response.getTwoFactorRequired());
        assertEquals(Boolean.FALSE, response.getTwoFactorEnrolled());
        assertEquals(Boolean.FALSE, response.getEmailTwoFactorAllowed());
        assertEquals("pending-admin", response.getPendingToken());
        assertNull(response.getAccessToken());
    }

    private static User student() {
        User user = new User("arclight", "arclight@apiarena.dev", "hash", User.Role.STUDENT);
        user.setId(9L);
        user.setEmailVerified(true);
        user.setIsActive(true);
        return user;
    }

    private static LoginRequest login() {
        LoginRequest request = new LoginRequest();
        request.setEmail("Arclight@apiarena.dev");
        request.setPassword("Arena2025!");
        return request;
    }
}
