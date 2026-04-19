package com.apiarena.authservice.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.apiarena.authservice.model.entities.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmailVerificationToken(String emailVerificationToken);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    @Query("SELECT u FROM User u WHERE u.role = 'STUDENT' AND u.isActive = true " +
           "AND (LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<User> searchStudents(@Param("q") String query);

    @Query("SELECT u FROM User u WHERE u.isActive = true AND u.id <> :excludeId "
            + "AND (LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<User> searchUsersForSocial(@Param("q") String query, @Param("excludeId") Long excludeId);

    List<User> findByRoleAndEmailVerifiedTrueAndNewChallengeEmailAlertsTrue(User.Role role);
}
