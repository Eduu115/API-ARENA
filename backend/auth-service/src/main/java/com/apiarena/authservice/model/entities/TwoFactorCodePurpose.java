package com.apiarena.authservice.model.entities;

/** Why a one-time email code was issued. Stored as VARCHAR, checked in the database. */
public enum TwoFactorCodePurpose {
    LOGIN,
    ENABLE,
    DISABLE
}
