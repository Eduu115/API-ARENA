package com.apiarena.authservice.model.services;

/** Six-digit numeric codes. Tests can supply a fixed implementation. */
public interface TwoFactorCodeGenerator {

    String nextCode();
}
