package com.apiarena.authservice.model.services;

import com.apiarena.authservice.model.entities.RefreshToken;
import com.apiarena.authservice.model.entities.User;

public interface IRefreshTokenService {

    RefreshToken createRefreshToken(User user);

    RefreshToken verifyRefreshToken(String token);

    void revokeRefreshToken(String token);

    void revokeAllUserTokens(User user);
}
