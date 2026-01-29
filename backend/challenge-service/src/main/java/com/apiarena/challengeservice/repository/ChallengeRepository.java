package com.apiarena.challengeservice.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.apiarena.challengeservice.model.entities.Challenge;

public interface ChallengeRepository extends JpaRepository<Challenge, Long> {

    Optional<Challenge> findBySlug(String slug);    
    boolean existsBySlug(String slug);
    List<Challenge> findByFeaturedTrue();
    List<Challenge> findByIsActiveTrue();
    List<Challenge> findByDifficultyAndIsActiveTrue(Challenge.Difficulty difficulty);
    List<Challenge> findByCategoryAndIsActiveTrue(String category);
    
    List<Challenge> findByDifficultyAndCategoryAndIsActiveTrue(
        Challenge.Difficulty difficulty, 
        String category
    );
    
    @Query("SELECT c FROM Challenge c WHERE " +
           "c.isActive = true AND " +
           "(LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Challenge> searchChallenges(@Param("search") String search);
    
    @Query("SELECT DISTINCT c.category FROM Challenge c WHERE c.isActive = true ORDER BY c.category")
    List<String> findAllCategories();
}
