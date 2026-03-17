package com.apiarena.submissionservice.config;

import java.util.Date;
import java.util.function.Function;

import io.jsonwebtoken.Claims;

public interface IJwtService {

    String extractUsername(String token);

    Long extractUserId(String token);

    Date extractExpiration(String token);

    <T> T extractClaim(String token, Function<Claims, T> claimsResolver);

    Claims extractAllClaims(String token);

    boolean isTokenExpired(String token);

    boolean isTokenValid(String token);
}
