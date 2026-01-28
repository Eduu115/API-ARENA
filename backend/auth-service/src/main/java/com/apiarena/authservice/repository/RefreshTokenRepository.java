package com.apiarena.authservice.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.authservice.model.entities.RefreshToken;
import com.apiarena.authservice.model.entities.User;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    // podia ser int para manejar errores pero no es necesario, es unico y no hay que devolver nada y tenemos exception handler para manejar los errorestodo mejor
    void deleteByUser(User user);
    void deleteByToken(String token);
}
