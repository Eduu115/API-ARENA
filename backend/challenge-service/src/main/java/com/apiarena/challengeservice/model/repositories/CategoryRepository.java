package com.apiarena.challengeservice.model.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.apiarena.challengeservice.model.entities.Category;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    Optional<Category> findBySlug(String slug);
    
    Optional<Category> findByName(String name);
    
    List<Category> findAllByIsActiveOrderByDisplayOrderAsc(Boolean isActive);
    
    List<Category> findAllByOrderByDisplayOrderAsc();
    
    boolean existsBySlug(String slug);
    
    boolean existsByName(String name);
    
    @Query("SELECT c FROM Category c LEFT JOIN FETCH c.challenges WHERE c.id = :id")
    Optional<Category> findByIdWithChallenges(Long id);
}
