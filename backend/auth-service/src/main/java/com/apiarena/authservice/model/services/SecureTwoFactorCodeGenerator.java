package com.apiarena.authservice.model.services;

import java.security.SecureRandom;

import org.springframework.stereotype.Component;

@Component
public class SecureTwoFactorCodeGenerator implements TwoFactorCodeGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    public String nextCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }
}
