package com.apiarena.authservice.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.authservice.model.entities.TwoFactorMethodKind;
import com.apiarena.authservice.model.entities.UserTwoFactorMethod;

public interface UserTwoFactorMethodRepository extends JpaRepository<UserTwoFactorMethod, Long> {

    List<UserTwoFactorMethod> findByUserId(Long userId);

    Optional<UserTwoFactorMethod> findByUserIdAndMethod(Long userId, TwoFactorMethodKind method);

    boolean existsByUserIdAndEnabledTrue(Long userId);
}
