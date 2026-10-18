package com.apiarena.authservice.model.entities;

/** Second factor a user can turn on. Stored as VARCHAR, checked in the database. */
public enum TwoFactorMethodKind {
    TOTP,
    EMAIL
}
