package com.apiarena.authservice.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiarena.authservice.model.entities.AccountDeletion;

public interface AccountDeletionRepository extends JpaRepository<AccountDeletion, Long> {

    boolean existsByEmailIgnoreCase(String email);

    List<AccountDeletion> findByPurgeAfterBefore(LocalDateTime cutoff);
}
