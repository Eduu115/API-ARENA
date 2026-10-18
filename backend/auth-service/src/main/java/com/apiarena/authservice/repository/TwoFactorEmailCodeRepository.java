package com.apiarena.authservice.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.authservice.model.entities.TwoFactorCodePurpose;
import com.apiarena.authservice.model.entities.TwoFactorEmailCode;

public interface TwoFactorEmailCodeRepository extends JpaRepository<TwoFactorEmailCode, Long> {

    Optional<TwoFactorEmailCode> findFirstByUserIdAndPurposeOrderByCreatedAtDescIdDesc(
            Long userId, TwoFactorCodePurpose purpose);
}
